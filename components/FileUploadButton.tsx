import React, { useState } from "react";
import { styled } from "@mui/material/styles";
import Button from "@mui/material/Button";
import CloudUploadIcon from "@mui/icons-material/CloudUpload";

const VisuallyHiddenInput = styled("input")({
  clip: "rect(0 0 0 0)",
  clipPath: "inset(50%)",
  height: 1,
  overflow: "hidden",
  position: "absolute",
  bottom: 0,
  left: 0,
  whiteSpace: "nowrap",
  width: 1,
});

interface FileUploadButtonProps {
  onConfirm: (file: File | null, isConfirmed: boolean) => void;
}

const FileUploadButton: React.FC<FileUploadButtonProps> = ({ onConfirm }) => {
  const [file, setFile] = useState<File | null>(null);
  const [isConfirmed, setIsConfirmed] = useState<boolean>(false);

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = event.target.files?.[0];
    if (selectedFile) {
      const fileType = selectedFile.type;
      if (
        fileType ===
          "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" ||
        fileType === "text/csv"
      ) {
        setFile(selectedFile);
        setIsConfirmed(false); 
      } else {
        alert("Please upload a valid .xlsx or .csv file");
      }
    }
  };

  const handleConfirm = () => {
    setIsConfirmed(true); 
    onConfirm(file, true); 
    alert("File confirmed!");
  };

  const handleChangeFile = () => {
    setFile(null);
    setIsConfirmed(false); 
  };

  return (
    <div>
      <Button
        component="label"
        size="small"
        variant="contained"
        startIcon={<CloudUploadIcon />}
        className="m-3 inline px-2 py-4"
      >
        {file ? "Change File" : "Upload File"}
        <VisuallyHiddenInput
          type="file"
          accept=".xlsx, .csv"
          onChange={handleFileChange}
        />
      </Button>

      {file && !isConfirmed && (
        <>
          <p className="mt-6">File selected: {file.name}</p>
          <Button
            variant="contained"
            color="success"
            className="m-4 inline px-2 py-2 min-w-auto"
            onClick={handleConfirm}
          >
            Confirm
          </Button>
        </>
      )}

      {isConfirmed && (
        <p className="mt-6">File has been confirmed!</p>
      )}
    </div>
  );
};

export default FileUploadButton;