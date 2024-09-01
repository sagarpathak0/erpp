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
  marks_obtained: number | null;
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
  mother: string;
  father: string;
  results: SemesterResult[];
  abc_id: string;
}

function eval_grade(gp: number) {
  if (gp == 10) return "O";
  else if (gp == 9) return "A+";
  else if (gp == 8) return "A";
  else if (gp == 7) return "B+";
  else if (gp == 6) return "B";
  else if (gp == 5) return "C";
  else if (gp == 4) return "P";
  else return "F";
}

function sgpa_calc(marks: Mark[]) {
  let total_credit = 0;
  let ci_pi = 0;
  marks.map((mark) => {
    total_credit += mark.credit;
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
        grade: eval_grade(eval_gp(parseFloat(row["Mark Obt"] || 0))),
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
      for (var i = 0; i < subjectCodes.length; i++) {
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
            obj[newHeaders[j]] = val[6 + i];
          }
        }
        updatedData.push(obj);
      }
    }
    return updatedData;
  };

  const renderStudentResults = (student: Student) => {
    return student.results.flatMap((result) => (
      <div key={result.semester} className="page-break">
        <div className="text-center flex flex-col mx-auto p-1">
          <div className="text-dseublue text-2xl font-extrabold font-mono">
            दिल्ली कौशल एवं उद्यमिता विश्वविद्यालय
          </div>
          <div className="text-dseublue text-4xl font-extrabold font-serif">
            Delhi Skill & Entrepreneurship University
          </div>
          <div className="text-dseublue text-lg font-extrabold font-serif">
            (A State University Established under Govt. of NCT of Delhi Act 04
            of 2020)
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

        <div className="student-info mb-4">
          <table className="w-full border-collapse">
            <thead>
              <tr>
                <th className="border p-2">Student Name</th>
                <th className="border p-2">Father's Name</th>
                <th className="border p-2">Mother's Name</th>
                <th className="border p-2">Roll No.</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td className="border p-2">{student.name}</td>
                <td className="border p-2">{student.father}</td>
                <td className="border p-2">{student.mother}</td>
                <td className="border p-2">{student.rollno}</td>
              </tr>
            </tbody>
          </table>
        </div>

        <div className="result-table mb-4">
          <table className="w-full border-collapse">
            <thead>
              <tr>
                <th className="border p-2">Course Code</th>
                <th className="border p-2">Course Name</th>
                <th className="border p-2">Credit</th>
                <th className="border p-2">Credit Earned</th>
                <th className="border p-2">Grade Point</th>
                <th className="border p-2">Grade</th>
              </tr>
            </thead>
            <tbody>
              {result.marks.map((mark, index) => (
                <tr key={index}>
                  <td className="border p-2">{mark.course_code}</td>
                  <td className="border p-2">{mark.course_name}</td>
                  <td className="border p-2">{mark.credit}</td>
                  <td className="border p-2">
                    {mark.grade_point >= 4 ? mark.credit : 0}
                  </td>
                  <td className="border p-2">{mark.grade_point}</td>
                  <td className="border p-2">{mark.grade}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="summary-table">
          <table className="w-full border-collapse">
            <thead>
              <tr>
                <th className="border p-2">Credits earned in this semester</th>
                <th className="border p-2">Total credits as on date</th>
                <th className="border p-2" colSpan={2}>
                  SGPA{" "}
                  <div className="w-full flex justify-evenly">
                    <th>Earned</th>
                    <th>Grade letter</th>
                  </div>
                </th>
                <th className="border p-2" colSpan={2}>
                  CGPA{" "}
                  <div className="w-full flex justify-evenly">
                    <th>Earned</th>
                    <th>Grade letter</th>
                  </div>
                </th>
                <th className="border p-2">Grading System</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td className="border p-2">
                  <div className="w-full flex justify-center">30</div>
                </td>
                <td className="border p-2">
                  <div className="w-full flex justify-center">-</div>
                </td>
                <td className="border p-2">
                  <div className="w-full flex justify-center">
                    {result.sgpa}
                  </div>
                </td>
                <td className="border p-2">
                  <div className="w-full flex justify-center">
                    {result.sem_grade}
                  </div>
                </td>
                <td className="border p-2">
                  <div className="w-full flex justify-center">-</div>
                </td>
                <td className="border p-2">
                  <div className="w-full flex justify-center">-</div>
                </td>
                <td className="border p-2">
                  <div className="w-full flex justify-center">ABS</div>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    ));
  };

  return (
    <div className="p-4">
      <FileUploadButton onConfirm={handleFileConfirmed} />
      {isSubmitted && studentDataJSON && (
        <div ref={componentRef}>
          {studentDataJSON.map((student) => renderStudentResults(student))}
        </div>
      )}
      {isSubmitted && studentDataJSON && (
        <ReactToPrint
          trigger={() => (
            <Button variant="contained" color="primary">
              Print
            </Button>
          )}
          content={() => componentRef.current!}
        />
      )}
    </div>
  );
};

export default Home;
