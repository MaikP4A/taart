function drawPieChart(svgElement, finalPercentages, colors) {
    let startAngle = 0;
    let currentPercentages = finalPercentages.map(() => 0);
    const totalSteps = 160;
    let step = 0;

    function updateChart() {
        svgElement.innerHTML = '';

        // Draw Background Circle (Backplate)
        const backplate = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
        backplate.setAttribute('cx', '150');
        backplate.setAttribute('cy', '150');
        backplate.setAttribute('r', '110');
        backplate.setAttribute('fill', '#ddd');
        svgElement.appendChild(backplate);

        let angleStart = startAngle;
        currentPercentages.forEach((percentage, index) => {
            const angle = (percentage / 100) * 2 * Math.PI;
            const x1 = 150 + 100 * Math.sin(angleStart);
            const y1 = 150 - 100 * Math.cos(angleStart);
            const x2 = 150 + 100 * Math.sin(angleStart + angle);
            const y2 = 150 - 100 * Math.cos(angleStart + angle);
            const largeArcFlag = angle > Math.PI ? 1 : 0;

            const pathData = `M150,150 L${x1},${y1} A100,100 0 ${largeArcFlag},1 ${x2},${y2} Z`;
            const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
            path.setAttribute('d', pathData);
            path.setAttribute('fill', colors[index]);
            path.setAttribute('stroke', '#fff');
            path.setAttribute('stroke-width', '2');
            svgElement.appendChild(path);

            angleStart += angle;
        });

        step++;
        if (step <= totalSteps) {
            currentPercentages = currentPercentages.map((p, i) => 
                Math.min(finalPercentages[i], p + (finalPercentages[i] / totalSteps) * 2)
            );
            requestAnimationFrame(updateChart);
        }
    }

    requestAnimationFrame(updateChart);
}

function showPieChart() {
    const chart = document.getElementById('chartContainer');
    const svgElement = document.getElementById('pieChart');

    // Reset Pie Chart (Clear previous slices)
    svgElement.innerHTML = '';

    // Re-add Background Circle (Backplate)
    const backplate = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
    backplate.setAttribute('cx', '150');
    backplate.setAttribute('cy', '150');
    backplate.setAttribute('r', '110');
    backplate.setAttribute('fill', '#ddd');
    svgElement.appendChild(backplate);

    // Show Chart
    chart.style.opacity = '1';
    chart.style.transition = 'transform 0.5s cubic-bezier(0.34, 1.56, 0.64, 1)';
    chart.style.transform = 'translate(-50%, -50%) scale(1)';

    // Start Pie Chart Animation after 0.5s delay (smooth transition)
    setTimeout(() => {
        drawPieChart(svgElement, [40, 60], ['#FF6384', '#36A2EB']);
    }, 500);

    // Close Chart after 5 seconds
    setTimeout(() => {
        chart.style.transform = 'translate(-50%, -50%) scale(1.1)';
        setTimeout(() => {
            chart.style.transition = 'transform 0.5s cubic-bezier(0, 1, 0, 1)';
            chart.style.transform = 'translate(-50%, -50%) scale(0)';
        }, 300);
    }, 5000);
} 