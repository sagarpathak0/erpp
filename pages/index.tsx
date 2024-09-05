"use client";
import React, { useState, useRef } from "react";
import Papa from "papaparse";
import ReactToPrint from "react-to-print";
import FileUploadButton from "@/components/FileUploadButton";
import { Button } from "@mui/material";

interface Mark {
  course_code: string;
  course_name: string;
  credit: number;
  full_mark: number;
  marks_obtained: number | string | null;
  date_of_exam: string;
  grade_point: number;
  grade: string;
}

interface SemesterResult {
  semester: number;
  sgpa: number;
  sem_grade: string;
  academic_year: string;
  batch: number | null;
  marks: Mark[];
}

interface Student {
  rollno: string;
  name: string;
  program: string;
  category: string;
  campus: string;
  mother?: string;
  father?: string;
  guardian?: string;
  results: SemesterResult[];
  abc_id: string;
}

function eval_grade(gp: number, credit : number) {
  if (credit) {
    if (gp == 10) return "O";
    else if (gp == 9) return "A+";
    else if (gp == 8) return "A";
    else if (gp == 7) return "B+";
    else if (gp == 6) return "B";
    else if (gp == 5) return "C";
    else if (gp == 4) return "P";
    else return "F";
  } else {
    if (gp >=4){
      return "S";
    } else {
      return "N"
    }
  }
}

function sgpa_calc(marks: Mark[]) {
  let total_credit = 0;
  let ci_pi = 0;
  marks.map((mark) => {
    total_credit += mark.grade_point? mark.credit : 0;
    ci_pi += mark.credit * mark.grade_point;
  });
  return total_credit > 0 ? parseFloat((ci_pi / total_credit).toFixed(2)) : 0;
}

function eval_gp(marks: number) {
  if (marks >= 90) return 10;
  else if (marks >= 80) return 9;
  else if (marks >= 70) return 8;
  else if (marks >= 60) return 7;
  else if (marks >= 50) return 6;
  else if (marks >= 45) return 5;
  else if (marks >= 40) return 4;
  else return 0;
}

function sem_grade(sgpa: number) {
  if (sgpa >= 9.5) return "O";
  else if (sgpa >= 8.5) return "A+";
  else if (sgpa >= 7.5) return "A";
  else if (sgpa >= 6.5) return "B+";
  else if (sgpa >= 5.5) return "B";
  else if (sgpa >= 4.5) return "C";
  else if (sgpa >= 4) return "P";
  else return "F";
}

const Home: React.FC = () => {
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [studentDataJSON, setStudentDataJSON] = useState<Student[] | null>(
    null
  );
  const componentRef = useRef<HTMLDivElement>(null);
  const [fileData, setFileData] = useState<File | null>(null);

  const handleFileConfirmed = (file: File | null, isConfirmed: boolean) => {
    if (file && isConfirmed) {
      parseCSV(file);
    }
  };

  const parseCSV = (file: File) => {
    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      complete: (results) => {
        const data = results.data as any[];
        const students: Student[] = [];

        if (data[0]["Roll No"]) {
          parseVerticalStructure(data, students);
        } else {
          parseVerticalStructure(parseHorizontalStructure(data), students);
        }

        setStudentDataJSON(students);
        setIsSubmitted(true);
      },
    });
  };

  const parseVerticalStructure = (data: any[], students: Student[]) => {
    data.forEach((row: any) => {
      if (!row["Roll No"] || !row["Sub Name"]) return;

      let student = students.find((s) => s.rollno === row["Roll No"]);

      const mark: Mark = {
        course_code: row["Course Code"],
        course_name: row["Sub Name"],
        credit: parseFloat(row["Credit"]),
        full_mark: parseFloat(row["Full Mark"]),
        marks_obtained: row["Mark Obt"] ? parseFloat(row["Mark Obt"]) : null,
        date_of_exam: row["Date of Exam"],
        grade_point: eval_gp(parseFloat(row["Mark Obt"] || 0)),
        grade: eval_grade(eval_gp(parseFloat(row["Mark Obt"] || 0)),parseFloat(row["Credit"])),
      };

      if (student) {
        let semesterResult = student.results.find(
          (r) => r.semester === parseInt(row["Sem"], 10)
        );
        if (!semesterResult) {
          semesterResult = {
            semester: parseInt(row["Sem"], 10),
            academic_year: row["Academic Year"],
            batch: row["Batch"] ? parseInt(row["Batch"], 10) : null,
            marks: [],
            sgpa: 0,
            sem_grade: "",
          };
          student.results.push(semesterResult);
        }
        semesterResult.marks.push(mark);
        semesterResult.sgpa = sgpa_calc(semesterResult.marks);
        semesterResult.sem_grade = sem_grade(semesterResult.sgpa);
      } else {
        const newSemesterResult: SemesterResult = {
          sgpa: 0,
          sem_grade: "",
          semester: parseInt(row["Sem"], 10),
          academic_year: row["Academic Year"],
          batch: row["Batch"] ? parseInt(row["Batch"], 10) : null,
          marks: [mark],
        };

        students.push({
          rollno: row["Roll No"],
          name: row["Std Name"],
          program: row["Program"],
          category: row["Pro Category"],
          campus: row["Inst Name"],
          mother: "mother", //to be updated
          father: "father", //to be updated
          results: [newSemesterResult],
          abc_id: "1234", //to be updated
          guardian: "Guardian", //to be updated
        });
        newSemesterResult.sgpa = sgpa_calc(newSemesterResult.marks);
        newSemesterResult.sem_grade = sem_grade(newSemesterResult.sgpa);
      }
    });
  };

  const parseHorizontalStructure = (data: any[]) => {
    const updatedData: any[] = [];
    const headers = Object.keys(data[0]);
    const creditRow = Object.values(data[3]).slice(6);
    const subjectCodes = Object.values(data[2]).slice(6);
    const subjectNames = Object.values(data[4]).slice(6);

    const newHeaders = [
      "Std Name",
      "Roll No",
      "Inst Name",
      "Pro Category",
      "Program",
      "Sem",
      "Course Code",
      "Credit",
      "Sub Name",
      "Mark Obt",
      "Full Mark",
      "Batch",
      "Academic Year",
      "Date of Exam",
    ];

    for (var k = 5; k < data.length; k++) {
      const val = Object.values(data[k]);
      console.log(val)
      for (var i = 0; i < subjectCodes.length; i++) {
        let flag = 0;
        let obj: { [key: string]: any } = {};
        for (var j = 0; j < 14; j++) {
          if (j <= 5) {
            obj[newHeaders[j]] = val[j];
          } else if (j == 10) {
            obj[newHeaders[j]] = 100;
          } else if (j == 11) {
            obj[newHeaders[j]] = headers[0];
          } else if (j == 12) {
            obj[newHeaders[j]] = data[0][headers[0]];
          } else if (j == 13) {
            obj[newHeaders[j]] = data[1][headers[0]];
          } else if (j == 6) {
            obj[newHeaders[j]] = subjectCodes[i];
          } else if (j == 7) {
            obj[newHeaders[j]] = creditRow[i];
          } else if (j == 8) {
            obj[newHeaders[j]] = subjectNames[i];
          } else if (j == 9) {
            if (val[6+i]){
              obj[newHeaders[j]] = val[6 + i];
            }else{
              flag=1
            }
          }
        }
        if(flag){
          flag = 0
          continue;
        } else {
          updatedData.push(obj) 
        }
      }
    }
    return updatedData;
  };

  const renderStudentResults = (student: Student) => {
    return student.results.flatMap((result) => (
      <div key={result.semester} className="page-break my-4">
        <div className="flex w-full pt-10">
          <div className="flex w-1/4 justify-center items-center">
            <img
              src="/dseu-logo.png"
              alt="DSEU-LOGO"
              className="w-[29%] h-[60%] "
            />
          </div>
          <div>
            <div className="text-center flex flex-col mx-auto p-1 text-[#0072B9]">
              <div className="text-dseublue text-xl font-extrabold font-mono">
                दिल्ली कौशल एवं उद्यमिता विश्वविद्यालय
              </div>
              <div className="text-dseublue text-3xl font-extrabold font-serif">
                Delhi Skill & Entrepreneurship University
              </div>
              <div className="text-dseublue text-md font-extrabold font-serif">
                (A State University Established under Govt. of NCT of Delhi Act
                04 of 2020)
              </div>
            </div>
            <div className="text-center flex flex-col mx-auto">
              <div className="text-xl font-serif p-1">
                Grade sheet of EoSE of{" "}
                <span className="font-bold font-sans">June-2024</span>
              </div>
              <div className="text-lg font-bold font-serif mb-4">
                {student.program}-Batch{" "}
                <span className="font-sans">{result.batch}</span>
              </div>
            </div>
          </div>
        </div>

        <div className="border-[1px] px-4 mx-4 pt-4 ">
          <div className="student-info mb-4 flex justify-center">
            <div className="w-[80%] ">
              <div className="flex justify-between">
                <div className="flex-col">
                  <div className=" p-0">
                    Student Name :{" "}
                    <span className="font-bold uppercase">{student.name}</span>
                  </div>
                  <div className=" p-0  ">
                    Roll No. :{" "}
                    <span className="font-bold">{student.rollno}</span>
                  </div>
                </div>
                <div className="flex-col">
                  {student.father || student.mother ? (
                    <div>
                      {" "}
                      {student.father ? (
                        <div className="p-0">
                          Father's Name :{" "}
                          <span className="font-bold uppercase">{student.father}</span>
                        </div>
                      ) : (
                        ""
                      )}{" "}
                      {student.mother ? (
                        <div className="p-0">
                          Mother's Name :{" "}
                          <span className="font-bold uppercase">{student.mother}</span>
                        </div>
                      ) : (
                        ""
                      )}{" "}
                    </div>
                  ) : (
                    <div className="p-0">
                      Guadian's Name :{" "}
                      <span className="font-bold">{student.guardian}</span>
                    </div>
                  )}
                  {/* <div className=" p-2">Mother's Name : {student.mother}</div> */}
                </div>
              </div>
            </div>
          </div>

          <div className="result-table mb-4 w-full flex justify-center ">
            <div className="w-[90%] border border-collapse">
              {/* Header */}
              <div className="flex">
                <div className="border text-[11px] p-[6px] w-[10%] flex justify-center font-bold">
                  S.No
                </div>
                <div className="border text-[11px] p-[6px] w-[20%] flex justify-center font-bold">
                  Course Code
                </div>
                <div className="border text-[11px] p-[6px] w-[30%] flex justify-center font-bold">
                  Course Name
                </div>
                <div className="border text-[11px] p-[6px] w-[10%] flex justify-center font-bold">
                  Credit
                </div>
                <div className="border text-[11px] p-[6px] w-[10%] flex justify-center font-bold">
                  Credit Earned
                </div>
                <div className="border text-[11px] p-[6px] w-[10%] flex justify-center font-bold">
                  Grade
                </div>
                <div className="border text-[11px] p-[6px] w-[10%] flex justify-center font-bold">
                  Grade Point
                </div>
              </div>

              {/* Body */}
              {result.marks.map((mark, index) => (
                <div className="flex" key={index}>
                  <div className="border text-[10px] p-[6px] w-[10%] flex justify-center">
                    {index + 1}
                  </div>
                  <div className="border text-[10px] p-[6px] w-[20%]">
                    {mark.course_code}
                  </div>
                  <div className="border text-[10px] p-[6px] w-[30%]">
                    {mark.course_name}
                  </div>
                  <div className="border text-[10px] p-[6px] w-[10%] flex justify-center">
                    {mark.credit}
                  </div>
                  <div className="border text-[10px] p-[6px] w-[10%] flex justify-center">
                    {mark.grade_point >= 4 ? mark.credit : 0}
                  </div>
                  <div className="border text-[10px] p-[6px] w-[10%] flex justify-center">
                    {mark.grade}
                  </div>
                  <div className="border text-[10px] p-[6px] w-[10%] flex justify-center">
                    {mark.credit ? mark.grade_point : "-"}
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="summary-table w-full flex justify-center bottom-0 ">
            <div className="flex flex-col w-[90%] border border-collapse">
              {/* Header */}
              <div className="flex">
                <div className="border w-[14.28%] text-[11px] p-2">
                  <div className="flex w-full h-full justify-center items-center">
                    Credits earned in this semester
                  </div>
                </div>
                <div className="border w-[14.28%] text-[11px] p-2">
                  <div className="flex w-full h-full justify-center items-center">
                    Total credits as on date
                  </div>
                </div>
                <div className="border w-[28.56%] flex flex-col">
                  <div className="text-[11px] p-2">
                    <div className="flex w-full h-full justify-center items-center">
                      SGPA
                    </div>
                  </div>
                  <div className="flex justify-evenly">
                    <div className="border w-[50%] text-[11px] p-2">
                      <div className="flex w-full h-full justify-center items-center">
                        Earned
                      </div>
                    </div>
                    <div className="border w-[50%] text-[11px] p-2">
                      <div className="flex w-full h-full justify-center items-center">
                        Grade letter
                      </div>
                    </div>
                  </div>
                </div>
                <div className="border w-[28.56%] flex flex-col">
                  <div className="text-[11px] p-2">
                    <div className="flex w-full h-full justify-center items-center">
                      CGPA
                    </div>
                  </div>
                  <div className="flex justify-evenly">
                    <div className="border w-[50%] text-[11px] p-2">
                      <div className="flex w-full h-full justify-center items-center">
                        Earned
                      </div>
                    </div>
                    <div className="border w-[50%] text-[11px] p-2">
                      <div className="flex w-full h-full justify-center items-center">
                        Grade letter
                      </div>
                    </div>
                  </div>
                </div>
                <div className="border flex-1 text-[11px] p-2">
                  <div className="flex w-full h-full justify-center items-center">
                    Grading System
                  </div>
                </div>
              </div>

              {/* Body */}
              <div className="flex">
                <div className="border flex-1 text-[10px] p-2 flex justify-center">
                  30
                </div>
                <div className="border flex-1 text-[10px] p-2 flex justify-center">
                  -
                </div>
                <div className="border flex-1 text-[10px] p-2 flex justify-center">
                  {result.sgpa}
                </div>
                <div className="border flex-1 text-[10px] p-2 flex justify-center">
                  {result.sem_grade}
                </div>
                <div className="border flex-1 text-[10px] p-2 flex justify-center">
                  -
                </div>
                <div className="border flex-1 text-[10px] p-2 flex justify-center">
                  -
                </div>
                <div className="border flex-1 text-[10px] p-2 flex justify-center">
                  ABS
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    ));
  };

  return (
    <>
      <div className="bg-[#dfdede]"></div>
      <div className="mt-[154px] max-sm:mt-[150px] px-2 sm:ml-[250px] h-auto min-h-screen">
        <div className="bg-blue-800 py-2 px-2 sm:mx-8 rounded shadow mt-28">
          <h1 className="text-2xl text-white font-bold text-center">Student Result</h1>
        </div>
        <div className= "p-5">
        <FileUploadButton onConfirm={handleFileConfirmed} />
        </div>
      {isSubmitted && studentDataJSON && (
        <ReactToPrint
          trigger={() => (
            <Button className="ml-8" variant="contained" color="primary">
              Print PDF
            </Button>
          )}
          content={() => componentRef.current!}
        />
      )}
      {isSubmitted && studentDataJSON && (
        <div ref={componentRef} >
          {studentDataJSON.map((student) => renderStudentResults(student))}
        </div>
      )}
      </div>
    </>
  );
};

export default Home;
