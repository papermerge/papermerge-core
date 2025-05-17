import {Tooltip} from "@mantine/core"

interface Args {
  error: string | null
}

export default function ThumbnailPlaceholder({error}: Args) {
  return (
    <Tooltip label={error}>
      <svg
        width="120"
        height="160"
        viewBox="0 0 120 160"
        xmlns="http://www.w3.org/2000/svg"
        fill="none"
      >
        <path
          d="M20 20h50l30 30v90a10 10 0 0 1-10 10H30a10 10 0 0 1-10-10V30a10 10 0 0 1 10-10z"
          fill="#e5e7eb"
        />
        <path d="M70 20v30h30" fill="#d1d5db" />
        <rect x="35" y="75" width="50" height="10" rx="2" fill="#9ca3af" />
        <rect x="35" y="90" width="50" height="10" rx="2" fill="#d1d5db" />
        <rect x="35" y="105" width="40" height="10" rx="2" fill="#d1d5db" />
      </svg>
    </Tooltip>
  )
}
