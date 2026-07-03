"use client";

import { createContext, useContext, useEffect, useMemo, useState } from "react";

export interface Breadcrumb {
  label: string;
  href?: string;
}

interface PageHeaderState {
  title: string;
  breadcrumbs: Breadcrumb[];
}

interface PageHeaderContextValue {
  header: PageHeaderState;
  setHeader: (header: PageHeaderState) => void;
}

const DEFAULT_HEADER: PageHeaderState = { title: "", breadcrumbs: [] };

const PageHeaderContext = createContext<PageHeaderContextValue | null>(null);

export function PageHeaderProvider({ children }: { children: React.ReactNode }) {
  const [header, setHeader] = useState<PageHeaderState>(DEFAULT_HEADER);
  const value = useMemo(() => ({ header, setHeader }), [header]);
  return <PageHeaderContext.Provider value={value}>{children}</PageHeaderContext.Provider>;
}

/** Регистрирует заголовок и хлебные крошки текущей страницы в Navbar. */
export function usePageHeader(title: string, breadcrumbs: Breadcrumb[] = []) {
  const context = useContext(PageHeaderContext);
  const breadcrumbsKey = JSON.stringify(breadcrumbs);

  useEffect(() => {
    context?.setHeader({ title, breadcrumbs: JSON.parse(breadcrumbsKey) });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [title, breadcrumbsKey]);
}

export function usePageHeaderValue() {
  const context = useContext(PageHeaderContext);
  return context?.header ?? DEFAULT_HEADER;
}
