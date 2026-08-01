import React from 'react';

const joinClasses = (...classes) => classes.filter(Boolean).join(' ');

export const AppBody = ({ children, className = '' }) => (
  <section
    data-ui="app-body"
    className={joinClasses('flex-1 overflow-x-hidden pt-20', className)}
  >
    <div
      data-ui="app-body-content"
      className="mx-auto w-full max-w-6xl p-6 md:p-8"
    >
      {children}
    </div>
  </section>
);

export const AppBodySection = ({ children, className = '' }) => (
  <section
    className={joinClasses(className)}
  >
    {children}
  </section>
);

export const AppBodyTitle = ({ children, className = '' }) => (
  <h3 className={joinClasses('text-xs font-black uppercase tracking-widest text-slate-400', className)}>
    {children}
  </h3>
);
