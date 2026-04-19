import 'react-native-get-random-values';
import { v4 as uuidv4 } from 'uuid';

/**
 * Generates a unique task ID using the uuid library.
 */
export function generateId(): string {
  return uuidv4();
}
