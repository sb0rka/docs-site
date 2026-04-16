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
  GitHubNoteIcon,
} from 'nextra/icons';
import type {ComponentType, ReactNode, SVGProps} from 'react';

const icons: Record<string, ComponentType<SVGProps<SVGSVGElement>>> = {
  lock: GitHubImportantIcon,
  terminal: TerminalIcon,
  key: LinkIcon,
  database: GitHubNoteIcon,
  rocket: GitHubImportantIcon,
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
  const IconComponent = icon ? icons[icon] : null;
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
