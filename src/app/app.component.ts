import {
  CdkDragDrop,
  moveItemInArray,
  transferArrayItem,
} from '@angular/cdk/drag-drop';
import { Component } from '@angular/core';
import { AngularFirestore } from '@angular/fire/firestore';
import { MatDialog } from '@angular/material/dialog';
import { Status } from './status.model';
import {
  TaskDialogComponent,
  TaskDialogResult,
} from './task-dialog/task-dialog.component';
import { Task } from './task/task';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css'],
})
export class AppComponent {
  todo = this.store
    .collection('todo', (ref) => ref.where('status', '==', Status.ACTIVE))
    .valueChanges({ idField: 'id' });
  inProgress = this.store
    .collection('inProgress')
    .valueChanges({ idField: 'id' });
  done = this.store.collection('done').valueChanges({ idField: 'id' });

  constructor(private dialog: MatDialog, private store: AngularFirestore) {}

  drop(event: CdkDragDrop<Task[]>): void {
    if (event.previousContainer === event.container) {
      return;
    }
    const item = event.previousContainer.data[event.previousIndex];
    this.store.firestore.runTransaction(() => {
      const promise = Promise.all([
        this.store.collection(event.previousContainer.id).doc(item.id).delete(),
        this.store.collection(event.container.id).add(item),
      ]);
      return promise;
    });
    transferArrayItem(
      event.previousContainer.data,
      event.container.data,
      event.previousIndex,
      event.currentIndex
    );
  }

  newTask(): void {
    const dialogRef = this.dialog.open(TaskDialogComponent, {
      data: {
        task: { status: Status.ACTIVE },
      },
    });
    dialogRef.afterClosed().subscribe((result: TaskDialogResult) => {
      this.store.collection('todo').add(result.task);
    });
  }

  editTask(list: 'done' | 'todo' | 'inProgress', task: Task): void {
    console.warn('emitted');
    const dialogRef = this.dialog.open(TaskDialogComponent, {
      width: '270px',
      data: {
        task,
        enableDelete: true,
      },
    });
    dialogRef.afterClosed().subscribe((result: TaskDialogResult) => {
      if (result.delete) {
        task.status = Status.INACTIVE;
        this.store.collection(list).doc(task.id).update(task);
      } else {
        this.store.collection(list).doc(task.id).update(task);
      }
    });
  }
}
