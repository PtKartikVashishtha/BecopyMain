import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { Providers } from "@/store/provider";
import { AuthProvider } from "@/context/AuthContext";
import { SocketProvider } from "@/context/SocketContext";
import { ThemeProvider } from "next-themes";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "BeCopy Admin",
  description: "BeCopy Admin",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <head>
        {/* TinyMCE script */}
        <script
          src="https://cdn.tiny.cloud/1/xv8jfny0vl2h78pnplizgo6k5cposi1c8b2b4qkgrhzu83f4/tinymce/8/tinymce.min.js"
          referrerPolicy="origin"
          crossOrigin="anonymous"
        ></script>
        <script
          dangerouslySetInnerHTML={{
            __html: `
              if (typeof tinymce !== 'undefined') {
                tinymce.init({
                  selector: '#mytextarea',
                  height: 400,
                  menubar: false,
                  plugins: 'lists link image table code help wordcount',
                  toolbar:
                    'undo redo | formatselect | bold italic backcolor | \
                    alignleft aligncenter alignright alignjustify | \
                    bullist numlist outdent indent | removeformat | help'
                });
              }
            `,
          }}
        />
      </head>
      <body className={`${geistSans.variable} ${geistMono.variable} antialiased`}>
        <AuthProvider>
          <ThemeProvider defaultTheme="system" enableSystem attribute="class">
            <Providers>
              <SocketProvider>{children}</SocketProvider>
            </Providers>
          </ThemeProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
