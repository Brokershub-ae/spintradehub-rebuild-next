import { ReactNode } from "react";
import { SiteHeader } from "@/components/SiteHeader";

type PageFrameProps = {
  title: string;
  subtitle?: string;
  children: ReactNode;
};

export function PageFrame({ title, subtitle, children }: PageFrameProps) {
  return (
    <>
      <SiteHeader />
      <main className="page">
        <div className="container">
          <h1 className="page-title">{title}</h1>
          {subtitle ? <p className="meta">{subtitle}</p> : null}
          {children}
        </div>
      </main>
    </>
  );
}
