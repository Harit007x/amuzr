"use client";
import { SessionProvider } from "next-auth/react";
import React from "react";
import { ThemeProvider } from "../components/theme-provider";
import { RecoilRoot } from 'recoil';

const Providers = ({ children }: { children: React.ReactNode }) => {
  return (
    <SessionProvider>
      <ThemeProvider
        attribute="class"
        defaultTheme="dark"
        enableSystem
        disableTransitionOnChange
      >
        <RecoilRoot>{children}</RecoilRoot>
      </ThemeProvider>
    </SessionProvider>
  );
};

export default Providers;
