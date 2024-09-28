import MeiliSearch from 'meilisearch';
import config from '../config';
import { TItem } from '../modules/Item/item.interface';
import { Document, Types } from 'mongoose';
import { noImage } from '../modules/Item/item.constant';

const meiliClient = new MeiliSearch({
  host: config.meilisearch_host as string,
  apiKey: config.meilisearch_master_key,
});

export async function addDocumentToIndex(
  result: Document<unknown, object, TItem> & TItem & { _id: Types.ObjectId },
  indexKey: string
) {
  const index = meiliClient.index(indexKey);

  const { _id, title, description, images } = result;
  const firstImage = images?.[0] || noImage;

  const document = {
    id: _id.toString(),
    title,
    description,
    images: firstImage,
  };

  console.log('Document to add:', document);

  try {
    const response = await index.addDocuments([document]);
    console.log('Document added successfully:', response);
  } catch (error) {
    console.error('Error adding document to MeiliSearch:', error);
  }
}

export const deleteDocumentFromIndex = async (indexKey: string, id: string) => {
  const index = meiliClient.index(indexKey);

  try {
    await index.deleteDocument(id);
  } catch (error) {
    console.error('Error deleting resource from MeiliSearch:', error);
  }
};

export default meiliClient;
