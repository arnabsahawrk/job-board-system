import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { cn, formatSalary, timeAgo } from "@/lib/utils";
import type { JobListItem } from "@/types";
import { Clock, MapPin } from "lucide-react";
import { Link } from "react-router-dom";
import { CompanyLogoFallback } from "@/components/branding/Brand";

const JOB_TYPE_LABELS: Record<string, string> = {
  full_time: "Full-time",
  part_time: "Part-time",
  remote: "Remote",
  contract: "Contract",
  internship: "Internship",
};

const JOB_TYPE_VARIANTS: Record<string, "default" | "secondary" | "success" | "info" | "warning"> =
  {
    full_time: "default",
    remote: "success",
    part_time: "secondary",
    contract: "warning",
    internship: "info",
  };

interface JobCardProps {
  job: JobListItem;
  className?: string;
}

export function JobCard({ job, className }: JobCardProps) {
  return (
    <Link to={`/jobs/${job.id}`} className="group block h-full">
      <Card
        className={cn(
          "h-full transition-all duration-200 hover:border-primary/40 hover:shadow-md",
          className,
        )}
      >
        <CardContent className="p-4 sm:p-5 flex flex-col gap-4 h-full">
          {/* Top Section */}
          <div className="flex gap-3">
            {/* Logo */}
            <div className="flex h-11 w-11 sm:h-10 sm:w-10 shrink-0 items-center justify-center rounded-lg border bg-background overflow-hidden">
              {job.company_logo ? (
                <img
                  src={job.company_logo}
                  alt={job.company_name}
                  className="h-full w-full object-cover"
                />
              ) : (
                <CompanyLogoFallback className="h-7 w-7" />
              )}
            </div>

            {/* Title + Company */}
            <div className="flex-1 min-w-0 space-y-1">
              <h3 className="font-semibold text-sm leading-snug break-words group-hover:text-primary transition-colors">
                {job.title}
              </h3>
              <p className="text-xs text-muted-foreground truncate">{job.company_name}</p>

              {/* Badge on mobile */}
              <div className="sm:hidden pt-1">
                <Badge
                  variant={JOB_TYPE_VARIANTS[job.job_type] || "secondary"}
                  className="text-[11px] leading-none py-1"
                >
                  {JOB_TYPE_LABELS[job.job_type] || job.job_type}
                </Badge>
              </div>
            </div>

            {/* Badge on desktop */}
            <div className="hidden sm:block shrink-0">
              <Badge
                variant={JOB_TYPE_VARIANTS[job.job_type] || "secondary"}
                className="text-[11px] leading-none py-1"
              >
                {JOB_TYPE_LABELS[job.job_type] || job.job_type}
              </Badge>
            </div>
          </div>

          {/* Meta Section */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 text-xs text-muted-foreground mt-auto">
            <div className="flex flex-wrap items-center gap-3 min-w-0">
              {job.location && (
                <span className="flex items-center gap-1 min-w-0">
                  <MapPin className="h-3 w-3 shrink-0" />
                  <span className="truncate">{job.location}</span>
                </span>
              )}

              {job.salary && (
                <span className="font-medium text-emerald-600 dark:text-emerald-400">
                  {formatSalary(job.salary)}
                </span>
              )}
            </div>

            <span className="flex items-center gap-1 shrink-0 text-muted-foreground/80">
              <Clock className="h-3 w-3" />
              {timeAgo(job.created_at)}
            </span>
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}
