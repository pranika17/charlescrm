import React, { useEffect, useId, useRef, useState } from "react";

function normalizeValue(value) {
  return String(value || "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
}

function toIsoDate(date) {
  return date.toISOString().slice(0, 10);
}

function parseSpokenDate(transcript) {
  const cleaned = normalizeValue(transcript);
  const now = new Date();

  if (cleaned === "today") {
    return toIsoDate(now);
  }

  if (cleaned === "tomorrow") {
    const nextDay = new Date(now);
    nextDay.setDate(now.getDate() + 1);
    return toIsoDate(nextDay);
  }

  if (cleaned === "yesterday") {
    const previousDay = new Date(now);
    previousDay.setDate(now.getDate() - 1);
    return toIsoDate(previousDay);
  }

  const parsed = new Date(transcript);
  if (!Number.isNaN(parsed.getTime())) {
    return toIsoDate(parsed);
  }

  return "";
}

function parseSpokenNumber(transcript) {
  const match = transcript.replace(/,/g, "").match(/-?\d+(\.\d+)?/);
  return match ? match[0] : "";
}

function matchVoiceOption(transcript, options) {
  const normalizedTranscript = normalizeValue(transcript);

  return (
    options.find((option) => {
      const label = normalizeValue(option.label);
      const value = normalizeValue(option.value);
      return (
        normalizedTranscript === label ||
        normalizedTranscript === value ||
        normalizedTranscript.includes(label) ||
        label.includes(normalizedTranscript) ||
        normalizedTranscript.includes(value)
      );
    }) || null
  );
}

function buildVoiceValue({ transcript, control, type, options, appendVoice, currentValue }) {
  if (control === "select") {
    const matchedOption = matchVoiceOption(transcript, options);
    return matchedOption ? matchedOption.value : "";
  }

  if (type === "date") {
    return parseSpokenDate(transcript);
  }

  if (type === "number") {
    return parseSpokenNumber(transcript);
  }

  if (appendVoice && currentValue) {
    return `${currentValue.trim()} ${transcript}`.trim();
  }

  return transcript;
}

function cleanPlaceholder(value) {
  return String(value || "").replace(/^Example:\s*/i, "");
}

function MicIcon({ active = false }) {
  return (
    <svg aria-hidden="true" className="voice-button-icon" fill="none" viewBox="0 0 24 24">
      <path
        d="M12 14.5a3 3 0 0 0 3-3v-5a3 3 0 1 0-6 0v5a3 3 0 0 0 3 3Z"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="2"
      />
      <path
        d="M18 11.5a6 6 0 0 1-12 0M12 17.5V21M8.5 21h7"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="2"
      />
      {active ? <circle className="voice-button-dot" cx="18" cy="5" r="2.2" fill="currentColor" /> : null}
    </svg>
  );
}

export default function VoiceField({
  label,
  helper,
  error,
  voiceHint,
  value,
  onChangeValue,
  control = "input",
  type = "text",
  options = [],
  placeholder = "",
  required = false,
  disabled = false,
  rows = 3,
  className = "field",
  fieldClassName = "",
  appendVoice = false,
  list,
  min,
  max,
  step,
  accept,
  onChange,
}) {
  const fieldId = useId();
  const errorId = `${fieldId}-error`;
  const recognitionRef = useRef(null);
  const [isListening, setIsListening] = useState(false);
  const [voiceError, setVoiceError] = useState("");
  const supported = typeof window !== "undefined" && Boolean(window.SpeechRecognition || window.webkitSpeechRecognition);

  useEffect(() => {
    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.onresult = null;
        recognitionRef.current.onerror = null;
        recognitionRef.current.onend = null;
        recognitionRef.current.stop();
      }
    };
  }, []);

  function applyValue(nextValue) {
    if (onChangeValue) {
      onChangeValue(nextValue);
      return;
    }

    if (onChange) {
      onChange({ target: { value: nextValue } });
    }
  }

  function stopListening() {
    if (recognitionRef.current) {
      recognitionRef.current.stop();
    }
    setIsListening(false);
  }

  function startListening() {
    setVoiceError("");

    if (!supported) {
      setVoiceError("Voice capture is not supported in this browser.");
      return;
    }

    const RecognitionClass = window.SpeechRecognition || window.webkitSpeechRecognition;
    const recognition = new RecognitionClass();
    recognition.lang = "en-IN";
    recognition.continuous = false;
    recognition.interimResults = false;

    recognition.onstart = () => {
      setIsListening(true);
    };

    recognition.onresult = (event) => {
      const transcript = event.results[0]?.[0]?.transcript?.trim();
      if (!transcript) {
        setVoiceError("No speech was captured. Try again.");
        return;
      }

      const nextValue = buildVoiceValue({
        transcript,
        control,
        type,
        options,
        appendVoice,
        currentValue: value,
      });

      if (!nextValue) {
        setVoiceError(voiceHint || "Speech could not be converted for this field.");
        return;
      }

      applyValue(nextValue);
    };

    recognition.onerror = (event) => {
      if (event.error !== "aborted") {
        setVoiceError("Voice capture failed. Check microphone permission and try again.");
      }
    };

    recognition.onend = () => {
      setIsListening(false);
    };

    recognitionRef.current = recognition;
    recognition.start();
  }

  const describedBy = error || voiceError ? errorId : undefined;
  const displayPlaceholder = cleanPlaceholder(placeholder);
  const sharedProps = {
    id: fieldId,
    className: `field-control ${fieldClassName}`.trim(),
    value,
    required,
    disabled,
    "aria-describedby": describedBy,
    "aria-invalid": Boolean(error || voiceError),
    onChange: (event) => applyValue(event.target.value),
  };

  return (
    <label className={className}>
      <span className="field-label-row">
        <span>{label}</span>
        {control !== "file" ? (
          <button
            aria-label={isListening ? `Stop voice fill for ${label}` : `Start voice fill for ${label}`}
            className={`voice-button ${isListening ? "voice-button--active" : ""}`}
            disabled={disabled}
            onClick={(event) => {
              event.preventDefault();
              if (isListening) {
                stopListening();
              } else {
                startListening();
              }
            }}
            title={isListening ? "Stop voice fill" : "Start voice fill"}
            type="button"
          >
            <MicIcon active={isListening} />
          </button>
        ) : null}
      </span>

      {control === "textarea" ? (
        <textarea {...sharedProps} placeholder={displayPlaceholder} rows={rows} />
      ) : null}

      {control === "select" ? (
        <select {...sharedProps}>
          {options.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      ) : null}

      {control === "input" ? (
        <input
          {...sharedProps}
          accept={accept}
          list={list}
          max={max}
          min={min}
          placeholder={displayPlaceholder}
          step={step}
          type={type}
        />
      ) : null}

      {error || voiceError ? (
        <span className="field-error" id={errorId}>
          {error || voiceError}
        </span>
      ) : null}
    </label>
  );
}
