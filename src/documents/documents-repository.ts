import { CreateDocumentDTO } from "./dto/createDocument.dto";

export interface DocumentRepository {
	create(document: CreateDocumentDTO): Promise<Document>;
}