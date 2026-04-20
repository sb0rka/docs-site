import type {MDXComponents} from 'mdx/types';
import {useMDXComponents as useDocsMDXComponents} from 'nextra-theme-docs';
import {Callout, Cards, Steps as NextraSteps} from 'nextra/components';
import Link from 'next/link';
import {
  TerminalIcon,
  FolderIcon,
  FileIcon,
  LinkIcon,
  GitHubIcon,
  InformationCircleIcon,
  GitHubImportantIcon,
} from 'nextra/icons';
import type {ComponentType, ReactNode, SVGProps} from 'react';

const DatabaseIcon = (props: SVGProps<SVGSVGElement>) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" {...props}>
    <ellipse cx="12" cy="6.5" rx="7" ry="3.5" />
    <path d="M5 6.5v5c0 1.93 3.13 3.5 7 3.5s7-1.57 7-3.5v-5" />
    <path d="M5 11.5v5c0 1.93 3.13 3.5 7 3.5s7-1.57 7-3.5v-5" />
  </svg>
);

const KeyIcon = (props: SVGProps<SVGSVGElement>) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" {...props}>
    <circle cx="7.5" cy="14.5" r="2.5" />
    <path d="M10 14.5h8" />
    <path d="M14.2 14.5v-2" />
    <path d="M16.6 14.5v-1.5" />
  </svg>
);

const ConsoleIcon = (props: SVGProps<SVGSVGElement>) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" {...props}>
    <path d="M7.5 17.5h8.5a4 4 0 0 0 .9-7.9A5.6 5.6 0 0 0 6.3 8.8a3.8 3.8 0 0 0 1.2 8.7Z" />
  </svg>
);

const icons: Record<string, ComponentType<SVGProps<SVGSVGElement>>> = {
  lock: KeyIcon,
  terminal: TerminalIcon,
  key: KeyIcon,
  database: DatabaseIcon,
  rocket: ConsoleIcon,
  console: ConsoleIcon,
  code: FileIcon,
  folder: FolderIcon,
  file: FileIcon,
  link: LinkIcon,
  github: GitHubIcon,
  info: InformationCircleIcon,
};

type CardProps = {
  title?: string;
  icon?: string;
  href?: string;
  children?: ReactNode;
};

type CardGroupProps = {
  cols?: number;
  children?: ReactNode;
};

type StepProps = {
  title?: string;
  children?: ReactNode;
};

const Card = ({title, icon, href, children}: CardProps) => {
  const normalizedIcon = icon?.trim().toLowerCase();
  const IconComponent = normalizedIcon ? icons[normalizedIcon] : null;
  return (
    <Link
      href={href ?? '#'}
      className={
        'x:group nextra-card x:flex x:flex-col x:justify-start x:overflow-hidden x:rounded-lg x:border x:border-gray-200 x:bg-gray-100 x:dark:border-neutral-700 x:dark:bg-neutral-800 x:text-current x:no-underline x:shadow x:hover:shadow-lg x:hover:border-gray-300 x:dark:hover:border-neutral-500 x:dark:hover:bg-neutral-700 x:transition-all x:duration-200 x:pb-8'
      }
    >
      <span
        className={
          'x:flex x:items-center x:gap-2 x:p-4 x:font-semibold x:text-gray-800 x:dark:text-gray-100'
        }
      >
        {IconComponent ? <IconComponent style={{width: '1.25rem', height: '1.25rem'}} /> : null}
        <span>{title ?? ''}</span>
      </span>
      {children ? (
        <span
          className={'x:block x:px-4 x:pb-6 x:text-sm x:text-gray-600 x:dark:text-gray-300'}
        >
          {children}
        </span>
      ) : null}
    </Link>
  );
};

const CardGroup = ({cols = 2, children}: CardGroupProps) => (
  <Cards num={cols}>
    {children}
  </Cards>
);



const Step = ({title, children}: StepProps) => (
  <>
    {title ? <h3>{title}</h3> : null}
    {children ? <div>{children}</div> : null}
  </>
);

const Warning = ({children}: {children?: ReactNode}) => (
  <Callout type="warning">{children}</Callout>
);

export function useMDXComponents(components: MDXComponents = {}): MDXComponents {
  return {
    ...useDocsMDXComponents(),
    Card,
    CardGroup,
    Steps: NextraSteps,
    Step,
    Tip: Callout,
    Note: Callout,
    Warning,
    ...components,
  };
}
