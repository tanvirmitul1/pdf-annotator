"use client"

interface SquigglyLineProps {
  x: number
  y: number
  width: number
  color: string
  amplitude: number
}

export function SquigglyLine({
  x,
  y,
  width,
  color,
  amplitude,
}: SquigglyLineProps) {
  const period = amplitude * 4
  const pathData: string[] = [`M ${x} ${y}`]

  for (let offset = 0; offset < width; offset += period) {
    pathData.push(`q ${period / 2} ${-amplitude} ${period} 0`)
  }

  return (
    <path
      d={pathData.join(" ")}
      fill="none"
      stroke={color}
      strokeWidth={1.5}
      strokeLinecap="round"
    />
  )
}
