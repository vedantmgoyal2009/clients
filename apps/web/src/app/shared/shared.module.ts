import { DragDropModule } from "@angular/cdk/drag-drop";
import { DatePipe, CommonModule } from "@angular/common";
import { NgModule } from "@angular/core";
import { FormsModule, ReactiveFormsModule } from "@angular/forms";
import { RouterModule } from "@angular/router";
import { InfiniteScrollModule } from "ngx-infinite-scroll";
import { ToastrModule } from "ngx-toastr";

import { JslibModule } from "@bitwarden/angular/jslib.module";
import {
  AsyncActionsModule,
  BadgeModule,
  ButtonModule,
  CalloutModule,
  DialogModule,
  FormFieldModule,
  IconButtonModule,
  IconModule,
  MenuModule,
  TableModule,
  TabsModule,
} from "@bitwarden/components";

// Register the locales for the application
import "./locales";

/**
 * This NgModule should contain the most basic shared directives, pipes, and components. They
 * should be widely used by other modules to be considered for adding to this module. If in doubt
 * do not add to this module.
 *
 * See: https://angular.io/guide/module-types#shared-ngmodules
 */
@NgModule({
  imports: [
    CommonModule,
    DragDropModule,
    FormsModule,
    ReactiveFormsModule,
    InfiniteScrollModule,
    RouterModule,
    JslibModule,

    // Component library
    BadgeModule,
    BadgeModule,
    ButtonModule,
    ButtonModule,
    CalloutModule,
    DialogModule,
    FormFieldModule,
    IconButtonModule,
    IconModule,
    MenuModule,
    TableModule,
    TabsModule,
    ToastrModule,
  ],
  exports: [
    CommonModule,
    InfiniteScrollModule,
    FormsModule,
    ReactiveFormsModule,
    RouterModule,
    JslibModule,

    // Component library
    AsyncActionsModule,
    BadgeModule,
    BadgeModule,
    ButtonModule,
    ButtonModule,
    CalloutModule,
    DialogModule,
    DragDropModule,
    FormFieldModule,
    IconButtonModule,
    IconModule,
    MenuModule,
    TableModule,
    TabsModule,
    ToastrModule,
  ],
  providers: [DatePipe],
  bootstrap: [],
})
export class SharedModule {}
