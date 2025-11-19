import { NgModule } from '@angular/core';
import { ProfileRoutingModule } from './profile-routing.module';
import { ProfileComponent } from './profile.component';

@NgModule({
  imports: [ProfileComponent, ProfileRoutingModule],
})
export class ProfileModule {}
