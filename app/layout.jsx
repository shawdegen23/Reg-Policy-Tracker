import "./globals.css";

export const metadata = {
  title: "TEC Regulatory Monitoring",
  description: "Live California regulatory monitoring — CPUC, CEC, CARB, AQMD, Legislature",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
