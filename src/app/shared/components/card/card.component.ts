import { Component, Input } from '@angular/core';

export type CardVariant = 'default' | 'elevated' | 'outlined' | 'interactive';

@Component({
  selector: 'app-card',
  standalone: false,
  templateUrl: './card.component.html',
  styleUrl: './card.component.scss',
})
export class CardComponent {
  @Input() variant: CardVariant = 'default';
  @Input() padding: 'none' | 'small' | 'medium' | 'large' = 'medium';
  @Input() hoverable = false;
  @Input() clickable = false;
  @Input() fullHeight = false;
}
