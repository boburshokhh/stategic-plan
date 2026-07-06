export type UserRole = "dept_user" | "direction_head" | "admin";
export type ReportStatus = "not_started" | "in_progress" | "completed";
export type SubtaskDepartmentRole = "owner" | "participant";
export type SummaryStatus = "draft" | "approved";

export interface Department {
  id: string;
  code: string;
  name: string;
  shortName: string | null;
}

export interface DepartmentMember {
  id: string;
  fullName: string;
  email: string;
  role: UserRole;
}

export interface AuthUser {
  id: string;
  email: string;
  fullName: string;
  role: UserRole;
  departmentId: string | null;
  department?: Department;
}

export interface LoginResponse {
  accessToken: string;
  user: AuthUser;
}

export interface ReportingPeriod {
  id: string;
  year: number;
  quarter: number;
  collectionStart: string;
  collectionEnd: string;
  aggregationStart: string;
  aggregationEnd: string;
}

export type ReportPhase = "collection" | "aggregation" | "execution";

export interface Direction {
  id: string;
  planId: string;
  code: string;
  name: string;
  sortOrder: number;
}

export interface DirectionYearTheme {
  id: string;
  directionId: string;
  year: number;
  themeTitle: string;
}

export interface Task {
  id: string;
  directionId: string;
  number: number | null;
  title: string;
  sortOrder: number;
  direction?: Direction;
}

export interface SubtaskDepartmentAssignment {
  id: string;
  subtaskId: string;
  departmentId: string;
  role: SubtaskDepartmentRole;
  department: Department;
}

export interface SubtaskParticipationEnrollment {
  role: SubtaskDepartmentRole;
  enrolledAt: string;
}

export interface SubtaskParticipationItem {
  subtaskId: string;
  year: number;
  title: string;
  sortOrder: number;
  expectedResult: string | null;
  task: { id: string; number: number | null; title: string };
  direction: { id: string; code: string; name: string };
  enrollment: SubtaskParticipationEnrollment | null;
  canUnenroll: boolean;
}

export interface ParticipateSubtasksResult {
  enrolled: number;
  skipped: number;
  reportsCreated: number;
}

export interface Subtask {
  id: string;
  taskId: string;
  year: number;
  title: string;
  sortOrder: number;
  expectedResult: string | null;
  departments?: SubtaskDepartmentAssignment[];
  task?: Task;
}

export interface ReportProgress {
  totalItems: number;
  completedItems: number;
  progressPercent: number;
}

export interface ReportItemAssignee {
  id: string;
  reportItemId: string;
  userId: string | null;
  externalName: string | null;
  user?: { id: string; fullName: string } | null;
}

export interface ReportAttachment {
  id: string;
  reportId: string;
  reportItemId: string | null;
  fileName: string;
  mimeType: string;
  sizeBytes: number;
  createdAt: string;
  uploadedById: string | null;
}

export interface ReportItem {
  id: string;
  reportId: string;
  title: string;
  content: string;
  status: ReportStatus;
  sortOrder: number;
  assignees: ReportItemAssignee[];
  attachments: ReportAttachment[];
}

export interface ReportRevision {
  id: string;
  reportId: string;
  content: string;
  changedAt: string;
  changedById: string | null;
  changedBy?: { id: string; fullName: string } | null;
}

export interface QuarterlyReport {
  id: string;
  subtaskId: string;
  reportingPeriodId: string;
  departmentId: string;
  content: string;
  status: ReportStatus;
  submittedById: string | null;
  submittedAt: string | null;
  reviewedById: string | null;
  reviewedAt: string | null;
  progress: ReportProgress;
  subtask?: Subtask;
  department?: Department;
  reportingPeriod?: ReportingPeriod;
  items?: ReportItem[];
  attachments?: ReportAttachment[];
  revisions?: ReportRevision[];
}

export interface StrategicPlanTree {
  id: string;
  title: string;
  yearFrom: number;
  yearTo: number;
  status: string;
  directions: Array<
    Direction & {
      yearThemes: DirectionYearTheme[];
      tasks: Array<Task & { subtasks: Subtask[] }>;
    }
  >;
}

export interface ImportSummary {
  directions: number;
  tasks: number;
  subtasks: number;
  departmentsCreated: number;
  reports: number;
}

export interface ImportStatus {
  lastImport: {
    fileName: string;
    importedAt: string;
    summary: ImportSummary;
  } | null;
  planStats: {
    directions: number;
    tasks: number;
    subtasks: number;
    quarterlyReports: number;
    departments: number;
  };
}

export interface DashboardDirectionStat {
  directionId: string;
  directionCode: string;
  directionName: string;
  totalExpected: number;
  completed: number;
  inProgress: number;
  missingCount: number;
  completenessPercent: number;
}

export interface DashboardMissingReport {
  directionId: string;
  directionName: string;
  subtaskId: string;
  subtaskTitle: string;
  taskTitle: string;
  departmentId: string;
  departmentName: string;
}

export interface DashboardOverview {
  year: number;
  quarter: number;
  reportingPeriodId?: string;
  directions: DashboardDirectionStat[];
  totals: {
    completed: number;
    inProgress: number;
    missingCount: number;
    totalExpected: number;
  };
  missingReports: DashboardMissingReport[];
  overallCompletenessPercent: number;
}
