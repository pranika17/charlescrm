import React, { useEffect, useMemo, useState } from "react";

import { MetricGrid } from "../components/DataViews";
import VoiceField from "../components/VoiceField";
import { createDailyLog, fetchDailyLogs, fetchProjectFiles, fetchProjects, resolveMediaUrl, uploadProjectFile } from "../services/api";

const progressPresets = [0, 25, 50, 75, 100];

const fileTypeOptions = [
  { value: "image", label: "Image" },
  { value: "bill", label: "Bill" },
  { value: "drawing", label: "Drawing" },
  { value: "document", label: "Document" },
];

const fileTypeMeta = {
  image: { icon: "IMG", label: "Image", className: "image" },
  bill: { icon: "BIL", label: "Bill", className: "bill" },
  drawing: { icon: "DWG", label: "Drawing", className: "drawing" },
  document: { icon: "DOC", label: "Document", className: "document" },
};

const initialLogForm = {
  project: "",
  log_date: "",
  title: "",
  description: "",
  progress_percent: 0,
  issue_notes: "",
  weather_notes: "",
};

const initialUploadForm = {
  file: null,
  title: "",
  description: "",
  file_type: "image",
};

function validateLogForm(form) {
  if (!form.project) {
    return "Choose a project before adding the daily log.";
  }
  if (!form.log_date) {
    return "Log date is required.";
  }
  if (!form.title.trim()) {
    return "Log title is required.";
  }
  if (!form.description.trim()) {
    return "Work description is required.";
  }
  const progress = Number(form.progress_percent);
  if (!Number.isFinite(progress) || progress < 0 || progress > 100) {
    return "Progress must be between 0 and 100.";
  }
  return "";
}

function validateUploadForm(form, selectedProject) {
  if (!selectedProject) {
    return "Choose a project before uploading files.";
  }
  if (!form.title.trim()) {
    return "File title is required.";
  }
  if (!form.file) {
    return "Choose a file to upload.";
  }
  return "";
}

function formatDate(value) {
  if (!value) {
    return "-";
  }
  return new Date(value).toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

function isImageFile(file) {
  if (!file) {
    return false;
  }
  if (file.file_type === "image") {
    return true;
  }
  return /\.(avif|gif|jpe?g|png|webp)$/i.test(file.file || "");
}

function SectionTitle({ icon, title, count }) {
  return (
    <div className="site-section-title">
      <span className="site-section-icon">{icon}</span>
      <div>
        <h3>{title}</h3>
        {typeof count === "number" ? <span>{count} saved</span> : null}
      </div>
    </div>
  );
}

function EmptyState({ title }) {
  return (
    <div className="site-empty-card">
      <span className="site-empty-icon">ADD</span>
      <strong>{title}</strong>
    </div>
  );
}

function DailyLogCard({ log }) {
  const progress = Math.min(Math.max(Number(log.progress_percent || 0), 0), 100);

  return (
    <article className="site-record-card site-log-card">
      <div className="site-record-top">
        <div className="site-record-title">
          <span className="site-card-icon">LOG</span>
          <div>
            <strong>{log.title}</strong>
            <span>{formatDate(log.log_date)}</span>
          </div>
        </div>
        <span className="site-progress-badge">{progress}%</span>
      </div>

      <div className="site-progress-track">
        <span style={{ width: `${progress}%` }} />
      </div>

      <p>{log.description}</p>

      <div className="site-note-grid">
        {log.issue_notes ? (
          <div className="site-note site-note--issue">
            <span>Issue</span>
            <strong>{log.issue_notes}</strong>
          </div>
        ) : null}
        {log.weather_notes ? (
          <div className="site-note">
            <span>Site Note</span>
            <strong>{log.weather_notes}</strong>
          </div>
        ) : null}
      </div>
    </article>
  );
}

function ProjectFileCard({ file }) {
  const meta = fileTypeMeta[file.file_type] || fileTypeMeta.document;
  const fileUrl = resolveMediaUrl(file.file);
  const shouldPreviewImage = isImageFile(file);

  return (
    <article className="site-record-card site-file-card">
      <a className={`site-file-preview site-file-preview--${meta.className}`} href={fileUrl} rel="noreferrer" target="_blank">
        {shouldPreviewImage ? <img alt={file.title} src={fileUrl} /> : <span>{meta.icon}</span>}
      </a>

      <div className="site-file-body">
        <div className="site-record-top">
          <div className="site-record-title">
            <span className={`site-card-icon site-card-icon--${meta.className}`}>{meta.icon}</span>
            <div>
              <strong>{file.title}</strong>
              <span>{formatDate(file.created_at)}</span>
            </div>
          </div>
          <span className={`site-file-badge site-file-badge--${meta.className}`}>{meta.label}</span>
        </div>

        {file.description ? <p>{file.description}</p> : null}
      </div>
    </article>
  );
}

export default function SiteOperationsPage() {
  const [projects, setProjects] = useState([]);
  const [selectedProject, setSelectedProject] = useState("");
  const [dailyLogs, setDailyLogs] = useState([]);
  const [projectFiles, setProjectFiles] = useState([]);
  const [logForm, setLogForm] = useState(initialLogForm);
  const [uploadForm, setUploadForm] = useState(initialUploadForm);
  const [filePreviewUrl, setFilePreviewUrl] = useState("");
  const [error, setError] = useState("");
  const [saveMessage, setSaveMessage] = useState("");

  useEffect(() => {
    async function loadProjects() {
      try {
        const projectList = await fetchProjects();
        setProjects(projectList);
        if (projectList[0]) {
          const projectId = String(projectList[0].id);
          setSelectedProject(projectId);
          setLogForm((current) => ({ ...current, project: projectId }));
        }
      } catch (requestError) {
        setError(requestError.message);
      }
    }

    loadProjects();
  }, []);

  useEffect(() => {
    async function loadProjectOperations() {
      if (!selectedProject) {
        setDailyLogs([]);
        setProjectFiles([]);
        return;
      }

      try {
        const [logsResponse, filesResponse] = await Promise.all([fetchDailyLogs(selectedProject), fetchProjectFiles(selectedProject)]);
        setDailyLogs(logsResponse);
        setProjectFiles(filesResponse);
      } catch (requestError) {
        setError(requestError.message);
      }
    }

    loadProjectOperations();
  }, [selectedProject]);

  useEffect(() => {
    if (!uploadForm.file || !uploadForm.file.type.startsWith("image/")) {
      setFilePreviewUrl("");
      return undefined;
    }

    const nextPreviewUrl = URL.createObjectURL(uploadForm.file);
    setFilePreviewUrl(nextPreviewUrl);
    return () => URL.revokeObjectURL(nextPreviewUrl);
  }, [uploadForm.file]);

  const selectedProjectName = useMemo(() => {
    const project = projects.find((item) => String(item.id) === String(selectedProject));
    return project ? `${project.code} - ${project.name}` : "Select a project";
  }, [projects, selectedProject]);
  const averageProgress = useMemo(() => {
    if (dailyLogs.length === 0) {
      return 0;
    }
    return Math.round(dailyLogs.reduce((sum, item) => sum + Number(item.progress_percent || 0), 0) / dailyLogs.length);
  }, [dailyLogs]);
  const imageCount = useMemo(() => projectFiles.filter((item) => isImageFile(item)).length, [projectFiles]);
  const metrics = [
    { label: "Daily Logs", value: dailyLogs.length },
    { label: "Site Files", value: projectFiles.length },
    { label: "Images / Avg", value: `${imageCount} / ${averageProgress}%` },
  ];

  async function handleLogSubmit(event) {
    event.preventDefault();
    const validationError = validateLogForm(logForm);
    if (validationError) {
      setError(validationError);
      return;
    }

    setError("");
    setSaveMessage("");

    try {
      await createDailyLog(logForm.project, {
        log_date: logForm.log_date,
        title: logForm.title.trim(),
        description: logForm.description.trim(),
        progress_percent: Number(logForm.progress_percent),
        issue_notes: logForm.issue_notes.trim(),
        weather_notes: logForm.weather_notes.trim(),
      });
      setLogForm((current) => ({
        ...initialLogForm,
        project: current.project,
      }));
      setDailyLogs(await fetchDailyLogs(selectedProject));
      setSaveMessage("Daily log saved to this project.");
    } catch (requestError) {
      setError(requestError.message);
    }
  }

  async function handleUploadSubmit(event) {
    event.preventDefault();
    const validationError = validateUploadForm(uploadForm, selectedProject);
    if (validationError) {
      setError(validationError);
      return;
    }

    setError("");
    setSaveMessage("");

    try {
      const formData = new FormData();
      formData.append("project", selectedProject);
      formData.append("title", uploadForm.title.trim());
      formData.append("description", uploadForm.description.trim());
      formData.append("file_type", uploadForm.file_type);
      formData.append("file", uploadForm.file);

      await uploadProjectFile(formData);
      setUploadForm(initialUploadForm);
      setProjectFiles(await fetchProjectFiles(selectedProject));
      setSaveMessage("File uploaded and saved to this project.");
    } catch (requestError) {
      setError(requestError.message);
    }
  }

  return (
    <section className="page site-operations-page">
      <div className="site-ops-hero">
        <div>
          <p className="eyebrow">Execution Control</p>
          <h2>Site Operations</h2>
          <p>Daily progress, proof images, bills, drawings, and site notes stay attached to the selected project.</p>
        </div>
        <div className="site-project-card">
          <span>Project</span>
          <strong>{selectedProjectName}</strong>
          <select
            className="field-control"
            value={selectedProject}
            onChange={(event) => {
              const nextProjectId = event.target.value;
              setSelectedProject(nextProjectId);
              setLogForm((current) => ({ ...current, project: nextProjectId }));
              setSaveMessage("");
            }}
          >
            <option value="">Select a project</option>
            {projects.map((project) => (
              <option key={project.id} value={project.id}>
                {project.code} - {project.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      {error ? <div className="notice-card error">{error}</div> : null}
      {saveMessage ? <div className="notice-card success">{saveMessage}</div> : null}

      <MetricGrid items={metrics} />

      <div className="split-layout split-layout--equal site-entry-grid">
        <section className="panel site-form-panel">
          <SectionTitle icon="LOG" title="Add Daily Work Log" />

          <form className="form-grid form-grid--two" onSubmit={handleLogSubmit}>
            <VoiceField
              label="Date"
              onChangeValue={(value) => setLogForm((current) => ({ ...current, log_date: value }))}
              type="date"
              value={logForm.log_date}
              voiceHint="Say a valid log date."
            />
            <VoiceField
              label="Title"
              onChangeValue={(value) => setLogForm((current) => ({ ...current, title: value }))}
              placeholder="Example: First-floor slab reinforcement"
              value={logForm.title}
            />
            <VoiceField
              label="Progress"
              max="100"
              min="0"
              onChangeValue={(value) => setLogForm((current) => ({ ...current, progress_percent: value }))}
              type="number"
              value={String(logForm.progress_percent)}
              voiceHint="Say a number between 0 and 100."
            />
            <div className="choice-row site-progress-options">
              {progressPresets.map((preset) => (
                <button
                  key={preset}
                  className={`choice-chip ${Number(logForm.progress_percent) === preset ? "choice-chip--active" : ""}`}
                  onClick={() => setLogForm((current) => ({ ...current, progress_percent: preset }))}
                  type="button"
                >
                  {preset}%
                </button>
              ))}
            </div>
            <VoiceField
              appendVoice
              className="field field--full"
              control="textarea"
              label="Work Description"
              onChangeValue={(value) => setLogForm((current) => ({ ...current, description: value }))}
              placeholder="Example: Completed column concreting for grid B2-B6 and curing started."
              rows={4}
              value={logForm.description}
            />
            <VoiceField
              appendVoice
              control="textarea"
              label="Issues / Delays"
              onChangeValue={(value) => setLogForm((current) => ({ ...current, issue_notes: value }))}
              placeholder="Example: Pump stopped for 45 minutes due to hose damage."
              rows={3}
              value={logForm.issue_notes}
            />
            <VoiceField
              control="textarea"
              label="Weather / Site Note"
              onChangeValue={(value) => setLogForm((current) => ({ ...current, weather_notes: value }))}
              placeholder="Example: Light rain after 3 PM, curing continued under sheet cover."
              rows={3}
              value={logForm.weather_notes}
            />
            <button className="primary-button field--full" type="submit">
              Save Daily Log
            </button>
          </form>
        </section>

        <section className="panel site-form-panel">
          <SectionTitle icon="IMG" title="Upload Work Images / Files" />

          <form className="form-grid form-grid--two" onSubmit={handleUploadSubmit}>
            <VoiceField
              className="field field--full"
              label="File Title"
              onChangeValue={(value) => setUploadForm((current) => ({ ...current, title: value }))}
              placeholder="Example: Slab steel before concreting"
              value={uploadForm.title}
            />
            <VoiceField
              control="select"
              label="File Type"
              onChangeValue={(value) => setUploadForm((current) => ({ ...current, file_type: value }))}
              options={fileTypeOptions}
              value={uploadForm.file_type}
              voiceHint="Say image, bill, drawing, or document."
            />
            <label className="field">
              <span>Choose File</span>
              <input
                className="field-control"
                required
                type="file"
                onChange={(event) => setUploadForm((current) => ({ ...current, file: event.target.files?.[0] || null }))}
              />
            </label>
            <VoiceField
              appendVoice
              className="field field--full"
              control="textarea"
              label="Description"
              onChangeValue={(value) => setUploadForm((current) => ({ ...current, description: value }))}
              placeholder="Example: Pre-pour inspection image for east wing slab."
              rows={3}
              value={uploadForm.description}
            />

            <div className="site-upload-preview field--full">
              {filePreviewUrl ? (
                <img alt="Selected upload preview" src={filePreviewUrl} />
              ) : (
                <div>
                  <span>{uploadForm.file ? "FILE" : "IMG"}</span>
                  <strong>{uploadForm.file ? uploadForm.file.name : "Image preview appears here"}</strong>
                </div>
              )}
            </div>

            <button className="primary-button field--full" type="submit">
              Upload File
            </button>
          </form>
        </section>
      </div>

      <div className="split-layout split-layout--equal site-saved-grid">
        <section className="site-saved-section">
          <SectionTitle count={dailyLogs.length} icon="LOG" title="Saved Daily Logs" />
          <div className="site-record-list">{dailyLogs.length ? dailyLogs.map((log) => <DailyLogCard key={log.id} log={log} />) : <EmptyState title="No daily logs saved for this project." />}</div>
        </section>

        <section className="site-saved-section">
          <SectionTitle count={projectFiles.length} icon="IMG" title="Saved Files & Image Proof" />
          <div className="site-record-list">{projectFiles.length ? projectFiles.map((file) => <ProjectFileCard file={file} key={file.id} />) : <EmptyState title="No files uploaded for this project." />}</div>
        </section>
      </div>
    </section>
  );
}
