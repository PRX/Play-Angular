import { Component } from '@angular/core';

@Component({
  styleUrls: ['app/+demo/demo.component.css'],
  templateUrl: 'app/+demo/demo.component.html'
})
export class DemoComponent {
  private backgroundColor = 'white';

  private setColor(color: string) {
    this.backgroundColor = color;
  }
}
