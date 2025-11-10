import { Component, Input, Output, EventEmitter } from '@angular/core';

@Component({
  selector: 'app-empty-state',
  standalone: false,
  templateUrl: './empty-state.component.html',
  styleUrl: './empty-state.component.scss',
})
export class EmptyStateComponent {
  @Input() icon: string = 'inbox';
  @Input() title: string = 'No items found';
  @Input() message: string = 'There are no items to display';
  @Input() actionLabel?: string;
  @Input() actionIcon?: string = 'add';
  @Input() showAction: boolean = true;
  @Input() size: 'small' | 'medium' | 'large' = 'medium';

  @Output() action = new EventEmitter<void>();

  onActionClick(): void {
    this.action.emit();
  }
}
