/**
 * Interface for data objects for demo
 * @interface DataInterface
 * @property {string} title - The title of the study
 * @property {string} abstract - The abstract of the study
 * @property {string[]} authors - The authors of the study
 * @property {number} publicationYear - The publication year of the study
 */
export interface DataInterface {
  title: string;
  abstract: string;
  authors: string[];
  publicationYear: number;
}
