
# Improve Financial Graph Readability with Distinct Colors

## Overview
Update all charts on the Financials page to use distinct, vibrant colors for axes, grid lines, and data series so everything is easy to read at a glance.

## Changes (single file: `src/pages/Financials.tsx`)

### 1. Define a rich color palette
Add a dedicated `CHART_COLORS` constant with 6+ distinct colors for different data series (e.g., blue, emerald, amber, violet, rose, cyan), replacing the current muted HSL variable references that blend together.

### 2. Update all chart data series colors
- **Revenue tab (Stacked Bar)**: Each revenue stream gets a unique color -- SaaS Subscription (blue), Implementation Fees (emerald/green), NFC Hardware (amber/orange), Expansion (violet/purple)
- **MRR Growth (Area)**: Use a distinct teal/cyan fill and stroke
- **Tier Mix (Bar)**: Keep primary blue but brighten it
- **Break-Even (Cumulative Profit Area)**: Use emerald green for profit area, red dashed line for NINV reference
- **Institutions Bar**: Use a distinct indigo

### 3. Style chart axes and grid for contrast
- Set explicit `stroke` color on `XAxis` and `YAxis` (e.g., a medium gray like `#6b7280`) and increase tick font size slightly for readability
- Set `CartesianGrid` stroke to a lighter but visible gray (e.g., `#e5e7eb` light mode)
- Add `axisLine` styling so the axis lines themselves are visible

### 4. Improve Tooltip styling
- Add custom `contentStyle` to Tooltip components with a white background, border, and shadow for better contrast against chart backgrounds

## Technical Details
All changes are confined to `src/pages/Financials.tsx`. The color palette will use direct hex/HSL values for maximum control rather than CSS variables that may not render distinctly enough in chart contexts. Approximately 6-8 chart components will be updated with explicit color props on their `XAxis`, `YAxis`, `CartesianGrid`, `Bar`, `Area`, `Line`, and `Tooltip` elements.
