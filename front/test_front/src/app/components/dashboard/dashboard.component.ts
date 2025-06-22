// dashboard.component.ts
import { Component, OnInit } from '@angular/core';
import { Chart, registerables } from 'chart.js'; 
import { ArticleService } from '../../services/article.service';

@Component({
  selector: 'app-dashboard',
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.scss']
})
export class DashboardComponent implements OnInit {
  topArticles: any[] = [];
  trendsData: any;
  chart: any;

  constructor(private articleService: ArticleService) {
    Chart.register(...registerables);
  }

  ngOnInit() {
    this.loadTopArticles();
    this.loadTrendsData();
  }

  loadTopArticles() {
    this.articleService.getTopArticles().subscribe({
      next: (response) => {
        this.topArticles = response.data;
      },
      error: (err) => console.error(err)
    });
  }

  loadTrendsData(days: number = 30) {
    this.articleService.getTrends(days).subscribe({
      next: (response) => {
        this.trendsData = response.data;
        this.renderChart();
      },
      error: (err) => console.error(err)
    });
  }

  renderChart() {
    if (this.chart) {
      this.chart.destroy();
    }

    const ctx = document.getElementById('trendsChart') as HTMLCanvasElement;
    this.chart = new Chart(ctx, {
      type: 'line',
      data: {
        labels: this.trendsData.map((item: any) => item._id),
        datasets: [
          {
            label: 'Views',
            data: this.trendsData.map((item: any) => item.totalViews),
            borderColor: 'rgba(75, 192, 192, 1)',
            backgroundColor: 'rgba(75, 192, 192, 0.2)',
            tension: 0.1
          },
          {
            label: 'Likes',
            data: this.trendsData.map((item: any) => item.totalLikes),
            borderColor: 'rgba(255, 99, 132, 1)',
            backgroundColor: 'rgba(255, 99, 132, 0.2)',
            tension: 0.1
          }
        ]
      },
      options: {
        responsive: true,
        plugins: {
          title: {
            display: true,
            text: 'Article Engagement Trends'
          },
          tooltip: {
            mode: 'index',
            intersect: false
          }
        },
        scales: {
          y: {
            beginAtZero: true
          }
        },
        interaction: {
          mode: 'nearest',
          axis: 'x',
          intersect: false
        }
      }
    });
  }

  updateTimeRange(days: number) {
    this.loadTrendsData(days);
  }
}