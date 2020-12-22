import { Status } from '../status.enum';

export interface Task {
  id?: string;
  title: string;
  description: string;
  status?: Status;
}
