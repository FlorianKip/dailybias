/**
 * Daily BIAS Application
 * Initializes and manages an interactive pie chart and table for BIAS analysis.
 * Handles button toggling, slider updates, percentage calculations, and PDF generation.
 */

let myPieChart; // Global variable for the Chart.js pie chart

document.addEventListener("DOMContentLoaded", () => {
  // Initialize Chart.js pie chart
  const ctx = document.getElementById("myPieChart").getContext("2d");
  myPieChart = new Chart(ctx, {
    type: "pie",
    data: {
      labels: ["Long", "Short", "Range"],
      datasets: [{
        data: [0, 0, 0],
        backgroundColor: ["#22c55e", "#ef4444", "#f59e0b"],
      }],
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: { display: false },
        tooltip: { enabled: false },
      },
    },
  });

  // DOM element references
  const elements = {
    longPercentage: document.getElementById("long-percentage"),
    shortPercentage: document.getElementById("short-percentage"),
    rangePercentage: document.getElementById("range-percentage"),
    printButton: document.getElementById("printButton"),
    btnLong: document.getElementById("btn-long"),
    btnShort: document.getElementById("btn-short"),
    btnRange: document.getElementById("btn-range"),
    btnClear: document.getElementById("btn-clear"),
  };

  /**
   * Adjusts color intensity by blending with white based on intensity (0 to 1).
   * @param {string} color - Color in hex (#rrggbb) or rgb format.
   * @param {number} intensity - Intensity value (0 = white, 1 = full color).
   * @returns {string} Adjusted color in rgb format.
   */
  function adjustColorIntensity(color, intensity) {
    let r, g, b;
    if (color.startsWith("#")) {
      r = parseInt(color.slice(1, 3), 16);
      g = parseInt(color.slice(3, 5), 16);
      b = parseInt(color.slice(5, 7), 16);
    } else if (color.startsWith("rgb")) {
      const parts = color.match(/\d+/g);
      [r, g, b] = parts.map(Number);
    } else {
      return "#ccc";
    }
    r = Math.round(r * intensity + 255 * (1 - intensity));
    g = Math.round(g * intensity + 255 * (1 - intensity));
    b = Math.round(b * intensity + 255 * (1 - intensity));
    return `rgb(${r},${g},${b})`;
  }

  /**
   * Updates the slider's background gradient and indicator color based on its value.
   * @param {HTMLInputElement} slider - The slider element.
   */
  function updateSliderColor(slider) {
    const value = Number(slider.value);
    const min = Number(slider.min) || 1;
    const max = Number(slider.max) || 10;
    const percentage = ((value - min) / (max - min)) * 100;
    slider.style.background = `linear-gradient(to right, #60a5fa 0%, #60a5fa ${percentage}%, rgba(0,0,0,0.3) ${percentage}%, rgba(0,0,0,0.3) 100%)`;

    const tr = slider.closest("tr");
    if (!tr) return;
    const activeBtn = tr.querySelector(".btn.active");
    const indicator = tr.querySelector(".color-indicator");
    if (!activeBtn || !indicator) {
      indicator.style.backgroundColor = "rgba(255,255,255,0.1)";
      return;
    }

    const val = activeBtn.getAttribute("data-value");
    const baseColor = {
      long: "rgb(34,197,94)",
      short: "rgb(239,68,68)",
      range: "rgb(245,158,11)",
    }[val] || "rgba(255,255,255,0.1)";
    const intensity = 0.1 + ((value - min) / (max - min)) * 0.9;
    indicator.style.backgroundColor = adjustColorIntensity(baseColor, intensity);
    calculateButtonPercentages();
  }

  /**
   * Toggles button selection in a row and updates slider and indicator.
   * @param {HTMLButtonElement} btn - The button element.
   */
  window.toggleSelection = function (btn) {
    const tr = btn.closest("tr");
    if (!tr) return;
    const buttons = tr.querySelectorAll(".btn");
    const slider = tr.querySelector(".slider");
    const indicator = tr.querySelector(".color-indicator");

    if (btn.classList.contains("active")) {
      btn.classList.remove("active");
      if (slider) {
        slider.disabled = true;
        slider.value = 5;
        slider.style.background = "rgba(0,0,0,0.3)";
      }
      if (indicator) indicator.style.backgroundColor = "rgba(255,255,255,0.1)";
    } else {
      buttons.forEach((b) => b.classList.remove("active"));
      btn.classList.add("active");
      if (slider) {
        slider.disabled = false;
        slider.value = 5;
        updateSliderColor(slider);
      }
    }
    calculateButtonPercentages();
    updateBackgroundColor();
  };

  /**
   * Updates the page background color based on the count of active statuses.
   */
  function updateBackgroundColor() {
    let counts = { long: 0, short: 0, range: 0 };
    document.querySelectorAll("tbody tr").forEach((tr) => {
      const indicator = tr.querySelector(".color-indicator");
      if (!indicator || !indicator.style.backgroundColor) return;
      const bg = indicator.style.backgroundColor;
      if (bg.includes("34, 197, 94")) counts.long++;
      else if (bg.includes("239, 68, 68")) counts.short++;
      else if (bg.includes("245, 158, 11")) counts.range++;
    });

    // Keep the original radial gradient background
    // We don't change the background based on counts in dark mode
  }

  /**
   * Calculates and updates the percentage display and pie chart based on active buttons and sliders.
   */
  function calculateButtonPercentages() {
    const activeButtons = Array.from(document.querySelectorAll("tbody tr"))
      .map((tr) => {
        const activeBtn = tr.querySelector(".btn.active");
        const slider = tr.querySelector(".slider");
        return activeBtn && slider && !slider.disabled
          ? { btn: activeBtn, weight: Number(slider.value) }
          : null;
      })
      .filter(Boolean);

    const totalWeight = activeButtons.reduce((sum, item) => sum + item.weight, 0);
    let weights = { long: 0, short: 0, range: 0 };
    activeButtons.forEach(({ btn, weight }) => {
      const val = btn.getAttribute("data-value");
      weights[val] += weight;
    });

    const percentages = {
      long: totalWeight > 0 ? Math.round((weights.long / totalWeight) * 100) : 0,
      short: totalWeight > 0 ? Math.round((weights.short / totalWeight) * 100) : 0,
      range: totalWeight > 0 ? Math.round((weights.range / totalWeight) * 100) : 0,
    };

    elements.longPercentage.textContent = `Long: ${percentages.long}%`;
    elements.shortPercentage.textContent = `Short: ${percentages.short}%`;
    elements.rangePercentage.textContent = `Range: ${percentages.range}%`;

    myPieChart.data.datasets[0].data = [percentages.long, percentages.short, percentages.range];
    myPieChart.update();

    updatePrintButtonState();
    updateBackgroundColor();
  }

  /**
   * Updates the print button's disabled state based on active selections.
   */
  function updatePrintButtonState() {
    elements.printButton.disabled = !document.querySelectorAll(".btn.active").length;
  }

  /**
   * Updates all rows to toggle a specific status and their sliders, respecting available buttons.
   * @param {string} value - The status value ("long", "short", "range").
   */
  function updateStatusAndSliders(value) {
    document.querySelectorAll("tbody tr").forEach((tr) => {
      const buttons = tr.querySelectorAll(".btn");
      const slider = tr.querySelector(".slider");
      const indicator = tr.querySelector(".color-indicator");
      const isSelected = Array.from(buttons).some(
        (btn) => btn.classList.contains("active") && btn.getAttribute("data-value") === value
      );
      const hasValueButton = Array.from(buttons).some(
        (btn) => btn.getAttribute("data-value") === value
      );

      buttons.forEach((btn) => btn.classList.remove("active"));
      if (!isSelected && hasValueButton) {
        buttons.forEach((btn) => {
          if (btn.getAttribute("data-value") === value) btn.classList.add("active");
        });
        if (slider) {
          slider.disabled = false;
          slider.value = 5;
          updateSliderColor(slider);
        }
      } else {
        if (slider) {
          slider.disabled = true;
          slider.value = 5;
          slider.style.background = "rgba(0,0,0,0.3)";
        }
        if (indicator) indicator.style.backgroundColor = "rgba(255,255,255,0.1)";
      }
    });
    calculateButtonPercentages();
  }

  /**
   * Toggles the active state of a bottom button.
   * @param {HTMLButtonElement} button - The button to toggle.
   */
  function toggleBottomButton(button) {
    if (button.classList.contains("active")) {
      button.classList.remove("active");
    } else {
      [elements.btnLong, elements.btnShort, elements.btnRange].forEach((btn) => btn.classList.remove("active"));
      button.classList.add("active");
    }
  }

  /**
   * Resets all selections, sliders, percentages, and the chart.
   */
  function clearAll() {
    document.querySelectorAll(".btn").forEach((btn) => btn.classList.remove("active"));
    document.querySelectorAll(".slider").forEach((slider) => {
      slider.disabled = true;
      slider.value = 5;
      slider.style.background = "rgba(0,0,0,0.3)";
    });
    document.querySelectorAll(".color-indicator").forEach((ind) => (ind.style.backgroundColor = "rgba(255,255,255,0.1)"));
    elements.longPercentage.textContent = "Long: 0%";
    elements.shortPercentage.textContent = "Short: 0%";
    elements.rangePercentage.textContent = "Range: 0%";
    [elements.btnLong, elements.btnShort, elements.btnRange].forEach((btn) => btn.classList.remove("active"));
    myPieChart.data.datasets[0].data = [0, 0, 0];
    myPieChart.update();
    updatePrintButtonState();
  }

  /**
   * Generates a PDF report of the current BIAS analysis.
   */
  function generatePDF() {
    const { jsPDF } = window.jspdf;
    const doc = new jsPDF();
    const currentDate = new Date();
    const weekdays = ["So", "Mo", "Di", "Mi", "Do", "Fr", "Sa"];
    const weekday = weekdays[currentDate.getDay()];

    function getWeekNumber(d) {
      d = new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()));
      d.setUTCDate(d.getUTCDate() + 4 - (d.getUTCDay() || 7));
      const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
      return Math.ceil((((d - yearStart) / 86400000) + 1) / 7);
    }

    const kw = getWeekNumber(currentDate);
    const formattedDate = `${weekday}, ${String(currentDate.getDate()).padStart(2, "0")}.${String(
      currentDate.getMonth() + 1
    ).padStart(2, "0")}.${String(currentDate.getFullYear()).slice(-2)} ${String(currentDate.getHours()).padStart(
      2,
      "0"
    )}:${String(currentDate.getMinutes()).padStart(2, "0")}:${String(currentDate.getSeconds()).padStart(2, "0")} (KW${kw})`;

    // Titel
    doc.setFontSize(18);
    doc.setTextColor(0, 102, 204);
    doc.text("Daily BIAS Auswertung", 20, 20);
    doc.setFontSize(12);
    doc.setTextColor(0);
    doc.text(formattedDate, 190, 20, null, null, "right");

    // Indikatoren-Abschnitt
    doc.setFontSize(14);
    doc.setFont(undefined, "bold");
    doc.text("Indikatoren und Bewertung:", 20, 40);
    doc.setFont(undefined, "normal");

    let yPos = 50;
    document.querySelectorAll("tbody tr").forEach((row) => {
      const activeButton = row.querySelector(".btn.active");
      if (activeButton) {
        const indicator = row.querySelector("td:nth-child(2)").textContent;
        const buttonValue = activeButton.dataset.value || "Nicht ausgewählt";
        const buttonContent = activeButton.textContent.trim();
        const weight = Number(row.querySelector(".slider").value);

        const buttonValueColor = {
          long: "green",
          short: "red",
          range: "orange",
        }[buttonValue.toLowerCase()] || "black";

        // Indikator-Text in einer Zeile halten
        doc.setFontSize(12);
        doc.setTextColor(0);

        // Maximale Breite für den Indikator-Text festlegen
        const maxIndicatorWidth = 80;
        const indicatorText = doc.splitTextToSize(`${indicator}: ${buttonContent}`, maxIndicatorWidth);

        // Indikator-Text in einer Zeile schreiben
        doc.text(indicatorText, 25, yPos);

        // Weight bar
        const barX = 120;
        const barY = yPos - 4;
        const barHeight = 5;
        const maxBarWidth = 50;
        const barWidth = (weight / 10) * maxBarWidth;

        doc.setDrawColor(200);
        doc.setFillColor(buttonValueColor);
        doc.rect(barX, barY, barWidth, barHeight, "F");
        doc.setDrawColor(180);
        doc.rect(barX, barY, maxBarWidth, barHeight);

        // Direction text
        doc.setTextColor(buttonValueColor);
        doc.text(buttonValue.toUpperCase(), 180, yPos);

        yPos += 10;
      }
    });

    // Auswertungs-Abschnitt
    yPos += 10;
    doc.setFontSize(14);
    doc.setFont(undefined, "bold");
    doc.setTextColor(0);
    doc.text("Auswertung:", 20, yPos);
    doc.setFont(undefined, "normal");
    yPos += 10;
    doc.setFontSize(12);

    // Prozentangaben
    doc.setTextColor(0, 128, 0);
    doc.text(elements.longPercentage.textContent, 25, yPos);
    yPos += 10;
    doc.setTextColor(255, 0, 0);
    doc.text(elements.shortPercentage.textContent, 25, yPos);
    yPos += 10;
    doc.setTextColor(255, 165, 0);
    doc.text(elements.rangePercentage.textContent, 25, yPos);
    yPos += 20;

    // Handlungsempfehlung
    doc.setFontSize(14);
    doc.setFont(undefined, "bold");
    doc.setTextColor(0);
    doc.text("Handlungsempfehlung:", 20, yPos);
    doc.setFont(undefined, "normal");
    yPos += 10;
    doc.setFontSize(12);

    const percentages = {
      long: Number(elements.longPercentage.textContent.match(/\d+/)[0]),
      short: Number(elements.shortPercentage.textContent.match(/\d+/)[0]),
      range: Number(elements.rangePercentage.textContent.match(/\d+/)[0]),
    };

    let recommendation, recommendationColor;
    if (percentages.long > percentages.short && percentages.long > percentages.range) {
      doc.setTextColor(0, 128, 0);
      recommendation = "Long-Position empfohlen";
      recommendationColor = "Long";
    } else if (percentages.short > percentages.long && percentages.short > percentages.range) {
      doc.setTextColor(255, 0, 0);
      recommendation = "Short-Position empfohlen";
      recommendationColor = "Short";
    } else if (percentages.range >= percentages.long && percentages.range >= percentages.short) {
      doc.setTextColor(255, 165, 0);
      recommendation = "Seitwärtsbewegung erwartet, keine klare Positionierung empfohlen";
      recommendationColor = "Range";
    } else {
      doc.setTextColor(0);
      recommendation = "Keine klare Empfehlung möglich, weitere Analyse erforderlich";
      recommendationColor = "Neutral";
    }

    doc.text(recommendation, 25, yPos);
    yPos += 20;

    // Footer
    const footerStaticText = "created with: ";
    const linkText = "https://floriankip.github.io/dailybias/";
    const pageWidth = doc.internal.pageSize.getWidth();

    // Breite des statischen Textes und des Links berechnen
    const staticTextWidth = doc.getTextWidth(footerStaticText);
    const linkTextWidth = doc.getTextWidth(linkText);
    const totalTextWidth = staticTextWidth + linkTextWidth;

    // X-Position für den zentrierten Footer berechnen
    const xPos = (pageWidth - totalTextWidth) / 2;
    const yPosFooter = doc.internal.pageSize.getHeight() - 10;

    // Schriftgröße für den Footer
    doc.setFontSize(10);

    // Statischen Text ("created with: ") in Schwarz zeichnen
    doc.setTextColor(0);
    doc.text(footerStaticText, xPos, yPosFooter);

    // Klickbaren Link in Blau zeichnen
    doc.setTextColor(0, 0, 255);
    const linkXPos = xPos + staticTextWidth;
    doc.textWithLink(linkText, linkXPos, yPosFooter, { url: linkText });

    // Dateiname
    const highestPercentage = Math.max(percentages.long, percentages.short, percentages.range);
    const fileName = `DailyBIAS_${weekday}_${currentDate.getDate()}_${currentDate.getMonth() + 1}_${currentDate
      .getFullYear()
      .toString()
      .slice(-2)}_${recommendationColor}_${highestPercentage}%.pdf`;

    doc.save(fileName);
  }

  // Event listeners
  document.querySelectorAll(".slider").forEach((slider) => {
    slider.addEventListener("input", (e) => updateSliderColor(e.target));
  });

  elements.btnLong.addEventListener("click", () => {
    toggleBottomButton(elements.btnLong);
    updateStatusAndSliders("long");
  });

  elements.btnShort.addEventListener("click", () => {
    toggleBottomButton(elements.btnShort);
    updateStatusAndSliders("short");
  });

  elements.btnRange.addEventListener("click", () => {
    toggleBottomButton(elements.btnRange);
    updateStatusAndSliders("range");
  });

  elements.btnClear.addEventListener("click", clearAll);
  elements.printButton.addEventListener("click", generatePDF);

  // Initial state
  clearAll();

  // =========================================================
  // Economic Events Calendar Functions
  // =========================================================

  function getNextFriday(date) {
    const result = new Date(date);
    result.setDate(result.getDate() + ((5 - result.getDay() + 7) % 7 || 7));
    return result;
  }

  function getFirstFriday(year, month) {
    const firstDay = new Date(year, month, 1);
    return getNextFriday(firstDay);
  }

  function getNextThursday(date) {
    const result = new Date(date);
    result.setDate(result.getDate() + ((4 - result.getDay() + 7) % 7 || 7));
    return result;
  }

  function formatEventDate(date) {
    const options = { weekday: 'short', day: '2-digit', month: '2-digit', year: 'numeric' };
    const dateStr = date.toLocaleDateString('de-DE', options);
    const timeStr = '14:30'; // Most US economic data releases at 14:30 CET
    return `📅 ${dateStr} um ${timeStr}`;
  }

  function getNextNFP() {
    const now = new Date();
    let year = now.getFullYear();
    let month = now.getMonth();
    
    let nextNFP = getFirstFriday(year, month);
    
    if (nextNFP <= now) {
      month++;
      if (month > 11) {
        month = 0;
        year++;
      }
      nextNFP = getFirstFriday(year, month);
    }
    
    return nextNFP;
  }

  function getNextFOMC() {
    // FOMC meeting dates for 2025 (update annually)
    const fomcDates2025 = [
      new Date(2025, 0, 29),  // Jan 28-29
      new Date(2025, 2, 19),  // Mar 18-19
      new Date(2025, 4, 7),   // May 6-7
      new Date(2025, 5, 18),  // Jun 17-18
      new Date(2025, 6, 30),  // Jul 29-30
      new Date(2025, 8, 17),  // Sep 16-17
      new Date(2025, 10, 6),  // Nov 5-6
      new Date(2025, 11, 17)  // Dec 16-17
    ];

    // FOMC meeting dates for 2026
    const fomcDates2026 = [
      new Date(2026, 0, 28),  // Jan 27-28
      new Date(2026, 2, 18),  // Mar 17-18
      new Date(2026, 4, 6),   // May 5-6
      new Date(2026, 5, 17),  // Jun 16-17
      new Date(2026, 6, 29),  // Jul 28-29
      new Date(2026, 8, 16),  // Sep 15-16
      new Date(2026, 10, 4),  // Nov 3-4
      new Date(2026, 11, 16)  // Dec 15-16
    ];

    const allDates = [...fomcDates2025, ...fomcDates2026];
    const now = new Date();
    
    for (let date of allDates) {
      if (date > now) {
        return date;
      }
    }
    
    return allDates[allDates.length - 1];
  }

  function getNextCPI() {
    const now = new Date();
    let year = now.getFullYear();
    let month = now.getMonth();
    
    let nextCPI = new Date(year, month, 11); // ~10th, but released on 11th typically
    
    if (nextCPI <= now) {
      month++;
      if (month > 11) {
        month = 0;
        year++;
      }
      nextCPI = new Date(year, month, 11);
    }
    
    return nextCPI;
  }

  function getNextGDP() {
    // GDP is released quarterly, typically late April, late July, late October, late January
    const now = new Date();
    const year = now.getFullYear();
    const gdpDates = [
      new Date(year, 0, 30),   // Q4 previous year (end of Jan)
      new Date(year, 3, 30),   // Q1 (end of Apr)
      new Date(year, 6, 30),   // Q2 (end of Jul)
      new Date(year, 9, 30),   // Q3 (end of Oct)
      new Date(year + 1, 0, 30) // Q4 (end of Jan next year)
    ];
    
    for (let date of gdpDates) {
      if (date > now) {
        return date;
      }
    }
    
    return gdpDates[gdpDates.length - 1];
  }

  function getNextRetailSales() {
    const now = new Date();
    let year = now.getFullYear();
    let month = now.getMonth();
    
    let nextRetail = new Date(year, month, 15);
    
    if (nextRetail <= now) {
      month++;
      if (month > 11) {
        month = 0;
        year++;
      }
      nextRetail = new Date(year, month, 15);
    }
    
    return nextRetail;
  }

  function getNextJoblessClaims() {
    const now = new Date();
    return getNextThursday(now);
  }

  function updateEconomicEvents() {
    const nfpEl = document.getElementById('nfp-date');
    const fomcEl = document.getElementById('fomc-date');
    const cpiEl = document.getElementById('cpi-date');
    
    if (nfpEl) nfpEl.textContent = formatEventDate(getNextNFP());
    if (fomcEl) fomcEl.textContent = formatEventDate(getNextFOMC());
    if (cpiEl) cpiEl.textContent = formatEventDate(getNextCPI());
  }

  // Update economic events on load and hourly
  updateEconomicEvents();
  setInterval(updateEconomicEvents, 3600000); // Update every hour
});
