import { Component, signal } from '@angular/core';;
import { SaloonHomePage } from './saloon-home-page/saloon-home-page';

@Component({
  selector: 'app-root',
  imports: [SaloonHomePage],
  templateUrl: './app.html',
  styleUrl: './app.scss',
})
export class App {
  protected readonly title = signal('TheRetroSaloon');
}
