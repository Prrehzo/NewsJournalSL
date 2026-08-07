export const GITHUB_LOGOS_BASE_URL = "https://raw.githubusercontent.com/Prrehzo/school-logos/main/";

export const schoolLogos = [
  {
    name: "Nelson Mandela Community College",
    filename: "nmcc_logo.png"
  },
  {
    name: "Saline High School",
    filename: "saline_high_school_logo.jpg"
  },
  {
    name: "Dev Logo",
    filename: "dev_logo.jpeg"
  }
];


export const getLogoUrl = (filename) => {
  if (!filename) return "";
  if (filename.startsWith("http")) return filename; // Already a full URL
  return `${GITHUB_LOGOS_BASE_URL}${filename}`;
};
