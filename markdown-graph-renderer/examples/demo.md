# Graph Rendering Demo

This document shows all supported chart types embedded directly in Markdown.

---

## 1. Line Chart

Use `chart:line` for time-series or trend data.

```chart:line
{
  "title": "Monthly Revenue 2024",
  "xLabel": "Month",
  "yLabel": "Revenue ($k)",
  "beginAtZero": true,
  "data": {
    "labels": ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"],
    "datasets": [
      {
        "label": "Product A",
        "data": [12,19,14,22,28,35,31,40,38,45,50,58],
        "borderColor": "#0070f3",
        "backgroundColor": "rgba(0,112,243,0.1)",
        "fill": true,
        "tension": 0.3
      },
      {
        "label": "Product B",
        "data": [5,8,12,9,15,20,18,25,22,30,28,34],
        "borderColor": "#f5a623",
        "backgroundColor": "rgba(245,166,35,0.1)",
        "fill": true,
        "tension": 0.3
      }
    ]
  }
}
```

---

## 2. Bar Chart

Use `chart:bar` for categorical comparisons.

```chart:bar
{
  "title": "Quarterly Sales by Region",
  "xLabel": "Quarter",
  "yLabel": "Sales ($k)",
  "beginAtZero": true,
  "data": {
    "labels": ["Q1","Q2","Q3","Q4"],
    "datasets": [
      { "label": "North", "data": [42,55,61,78], "backgroundColor": "#0070f3" },
      { "label": "South", "data": [30,40,35,50], "backgroundColor": "#f5a623" },
      { "label": "East",  "data": [20,28,33,42], "backgroundColor": "#7c3aed" }
    ]
  }
}
```

---

## 3. Pie Chart

Use `chart:pie` for part-to-whole comparisons.

```chart:pie
{
  "title": "Browser Market Share 2024",
  "legendPosition": "right",
  "data": {
    "labels": ["Chrome","Safari","Firefox","Edge","Other"],
    "datasets": [{
      "data": [65,18,4,5,8],
      "backgroundColor": ["#0070f3","#34aadc","#f5a623","#7c3aed","#aaa"]
    }]
  }
}
```

---

## 4. Histogram

Use `chart:hist` with a flat `values` array. The renderer auto-bins.

```chart:hist
{
  "title": "Exam Score Distribution",
  "xLabel": "Score range",
  "yLabel": "# Students",
  "bins": 8,
  "values": [42,52,55,58,60,61,63,65,67,68,70,71,72,73,74,75,75,76,77,78,79,80,80,81,82,83,84,85,85,86,87,88,89,90,91,92,95,97,99,100]
}
```

---

## 5. Scatter Plot

Use `chart:scatter` for correlations. Each point is `{"x": …, "y": …}`.

```chart:scatter
{
  "title": "Height vs Weight",
  "xLabel": "Height (cm)",
  "yLabel": "Weight (kg)",
  "data": {
    "datasets": [{
      "label": "Participants",
      "data": [
        {"x":155,"y":55},{"x":160,"y":62},{"x":165,"y":67},
        {"x":170,"y":70},{"x":175,"y":75},{"x":180,"y":80},
        {"x":185,"y":88},{"x":190,"y":93},{"x":162,"y":58},
        {"x":172,"y":72},{"x":168,"y":65},{"x":178,"y":82}
      ],
      "backgroundColor": "rgba(0,112,243,0.6)"
    }]
  }
}
```

---

## 6. Box Plot

Use `chart:box`. Supply raw arrays per group — the renderer computes min/Q1/median/Q3/max.

```chart:box
{
  "title": "Score Distribution by Class",
  "yLabel": "Score",
  "data": {
    "labels": ["Class A","Class B","Class C"],
    "datasets": [{
      "label": "Scores",
      "backgroundColor": "rgba(0,112,243,0.5)",
      "borderColor": "#0070f3",
      "data": [
        [55,60,65,70,72,74,76,78,80,85,90],
        [40,50,60,65,68,70,72,74,76,78,80,82,88],
        [70,72,74,76,78,80,82,84,85,86,88,90,92,95]
      ]
    }]
  }
}
```
