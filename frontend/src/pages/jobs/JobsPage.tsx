import { jobsApi } from "@/api/jobs";
import { EmptyState } from "@/components/common/EmptyState";
import { JobCard } from "@/components/common/JobCard";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import type { JobListItem } from "@/types";
import { Building2, ChevronLeft, ChevronRight, Search, X } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { extractErrorMessage } from "@/lib/utils";

const CATEGORIES = [
  { label: "All Categories", value: "" },
  { label: "Technology", value: "it" },
  { label: "Healthcare", value: "healthcare" },
  { label: "Finance", value: "finance" },
  { label: "Education", value: "education" },
  { label: "Marketing", value: "marketing" },
  { label: "Design", value: "design" },
  { label: "Other", value: "other" },
];

const JOB_TYPES = [
  { label: "All Types", value: "" },
  { label: "Full-time", value: "full_time" },
  { label: "Part-time", value: "part_time" },
  { label: "Remote", value: "remote" },
  { label: "Contract", value: "contract" },
  { label: "Internship", value: "internship" },
];

const ORDERING = [
  { label: "Newest first", value: "-created_at" },
  { label: "Oldest first", value: "created_at" },
  { label: "Highest salary", value: "-salary" },
];

const PAGE_SIZE = 12;
const ALL = "__all__"; // sentinel for "no filter" in Radix Select (can't use empty string)

export default function JobsPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [jobs, setJobs] = useState<JobListItem[]>([]);
  const [count, setCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const search = searchParams.get("search") || "";
  const category = searchParams.get("category") || "";
  const jobType = searchParams.get("job_type") || "";
  const location = searchParams.get("location") || "";
  const ordering = searchParams.get("ordering") || "-created_at";
  const page = parseInt(searchParams.get("page") || "1", 10);

  const [searchInput, setSearchInput] = useState(search);
  const [locationInput, setLocationInput] = useState(location);

  const fetchJobs = useCallback(async () => {
    setLoading(true);
    try {
      setErrorMessage(null);
      const { data } = await jobsApi.list({
        page,
        page_size: PAGE_SIZE,
        search: search || undefined,
        category: category || undefined,
        job_type: jobType || undefined,
        location: location || undefined,
        ordering,
      });
      setJobs(data.results);
      setCount(data.count);
    } catch (err) {
      setErrorMessage(extractErrorMessage(err));
      setJobs([]);
      setCount(0);
    } finally {
      setLoading(false);
    }
  }, [page, search, category, jobType, location, ordering]);

  useEffect(() => {
    fetchJobs();
  }, [fetchJobs]);

  const updateParam = (key: string, value: string) => {
    const params = new URLSearchParams(searchParams);
    const real = value === ALL ? "" : value;
    if (real) params.set(key, real);
    else params.delete(key);
    params.delete("page");
    setSearchParams(params);
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    const params = new URLSearchParams(searchParams);
    if (searchInput) params.set("search", searchInput);
    else params.delete("search");
    if (locationInput) params.set("location", locationInput);
    else params.delete("location");
    params.delete("page");
    setSearchParams(params);
  };

  const clearFilters = () => {
    setSearchInput("");
    setLocationInput("");
    setSearchParams({});
  };

  const hasFilters = search || category || jobType || location;
  const totalPages = Math.ceil(count / PAGE_SIZE);

  const setPage = (p: number) => {
    const params = new URLSearchParams(searchParams);
    params.set("page", String(p));
    setSearchParams(params);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  return (
    <div className="container py-8">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold font-display mb-1">Browse Jobs</h1>
        <p className="text-sm text-muted-foreground">
          {count > 0 ? `${count} openings available` : "Explore all openings"}
        </p>
      </div>

      {/* Search bar */}
      <form onSubmit={handleSearch} className="flex flex-col sm:flex-row gap-2.5 mb-5">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Job title or keyword"
            className="pl-9"
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
          />
        </div>
        <Input
          placeholder="Location"
          className="sm:w-44"
          value={locationInput}
          onChange={(e) => setLocationInput(e.target.value)}
        />
        <Button type="submit" className="shrink-0">
          Search
        </Button>
      </form>

      {/* Filter row */}
      <div className="flex flex-wrap items-center gap-2.5 mb-5">
        <Select value={category || ALL} onValueChange={(v) => updateParam("category", v)}>
          <SelectTrigger className="w-40 h-9 text-sm">
            <SelectValue placeholder="Category" />
          </SelectTrigger>
          <SelectContent>
            {CATEGORIES.map((c) => (
              <SelectItem key={c.value || ALL} value={c.value || ALL}>
                {c.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select value={jobType || ALL} onValueChange={(v) => updateParam("job_type", v)}>
          <SelectTrigger className="w-36 h-9 text-sm">
            <SelectValue placeholder="Job Type" />
          </SelectTrigger>
          <SelectContent>
            {JOB_TYPES.map((t) => (
              <SelectItem key={t.value || ALL} value={t.value || ALL}>
                {t.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select value={ordering} onValueChange={(v) => updateParam("ordering", v)}>
          <SelectTrigger className="w-40 h-9 text-sm">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {ORDERING.map((o) => (
              <SelectItem key={o.value} value={o.value}>
                {o.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        {hasFilters && (
          <Button
            variant="ghost"
            size="sm"
            onClick={clearFilters}
            className="h-9 text-muted-foreground hover:text-foreground"
          >
            <X className="h-3.5 w-3.5 mr-1.5" /> Clear
          </Button>
        )}

        <span className="ml-auto text-sm text-muted-foreground">
          {count} result{count !== 1 ? "s" : ""}
        </span>
      </div>

      {/* Active filter chips */}
      {hasFilters && (
        <div className="flex flex-wrap gap-2 mb-5">
          {search && (
            <FilterChip
              label={search}
              onRemove={() => {
                setSearchInput("");
                updateParam("search", "");
              }}
            />
          )}
          {category && (
            <FilterChip
              label={CATEGORIES.find((c) => c.value === category)?.label || category}
              onRemove={() => updateParam("category", "")}
            />
          )}
          {jobType && (
            <FilterChip
              label={JOB_TYPES.find((t) => t.value === jobType)?.label || jobType}
              onRemove={() => updateParam("job_type", "")}
            />
          )}
          {location && (
            <FilterChip
              label={location}
              onRemove={() => {
                setLocationInput("");
                updateParam("location", "");
              }}
            />
          )}
        </div>
      )}

      {/* Results grid */}
      {errorMessage && !loading && (
        <Card className="mb-4 border-destructive/40">
          <CardContent className="p-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <p className="text-sm text-destructive">{errorMessage}</p>
            <Button variant="outline" size="sm" onClick={fetchJobs}>
              Retry
            </Button>
          </CardContent>
        </Card>
      )}

      {loading ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 9 }).map((_, i) => (
            <Card key={i}>
              <CardContent className="p-5 space-y-3">
                <div className="flex gap-3">
                  <Skeleton className="h-10 w-10 rounded-lg shrink-0" />
                  <div className="flex-1 space-y-2">
                    <Skeleton className="h-4 w-3/4" />
                    <Skeleton className="h-3 w-1/2" />
                  </div>
                </div>
                <div className="flex gap-2">
                  <Skeleton className="h-5 w-16 rounded-full" />
                  <Skeleton className="h-5 w-20 rounded-full" />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : jobs.length === 0 ? (
        <EmptyState
          icon={Building2}
          title="No jobs found"
          description="Try adjusting your search or removing some filters."
          action={
            <Button variant="outline" onClick={clearFilters}>
              Clear all filters
            </Button>
          }
        />
      ) : (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {jobs.map((job) => (
              <div key={job.id} className="min-w-0">
                <JobCard job={job} />
              </div>
            ))}
            </div>

          {totalPages > 1 && (
            <div className="flex items-center justify-center gap-3 mt-10">
              <Button
                variant="outline"
                size="sm"
                disabled={page <= 1}
                onClick={() => setPage(page - 1)}
              >
                <ChevronLeft className="h-4 w-4 mr-1" /> Prev
              </Button>
              <span className="text-sm text-muted-foreground tabular-nums">
                {page} / {totalPages}
              </span>
              <Button
                variant="outline"
                size="sm"
                disabled={page >= totalPages}
                onClick={() => setPage(page + 1)}
              >
                Next <ChevronRight className="h-4 w-4 ml-1" />
              </Button>
            </div>
          )}
        </>
      )}
    </div>
  );
}

function FilterChip({ label, onRemove }: { label: string; onRemove: () => void }) {
  return (
    <Badge variant="secondary" className="gap-1 pr-1 pl-2.5 py-1 text-xs font-normal">
      {label}
      <button
        onClick={onRemove}
        className="ml-0.5 rounded-sm hover:bg-muted-foreground/20 h-4 w-4 inline-flex items-center justify-center transition-colors"
      >
        <X className="h-2.5 w-2.5" />
      </button>
    </Badge>
  );
}
