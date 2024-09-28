import { QueryBuilder } from '../../builder/QueryBuilder';
import { TImageFiles } from '../../interfaces/image.interface';
import meiliClient, {
  addDocumentToIndex,
  deleteDocumentFromIndex,
} from '../../utils/meilisearch';
// import {
//   addDocumentToIndex,
//   deleteDocumentFromIndex,
// } from '../../utils/meilisearch';
import { ItemsSearchableFields, noImage } from './item.constant';
import { TItem } from './item.interface';
import { Item } from './item.model';
import {
  SearchItemByDateRangeQueryMaker,
  SearchItemByUserQueryMaker,
} from './item.utils';

const createItemIntoDB = async (payload: TItem, images: TImageFiles) => {
  const { itemImages } = images;
  payload.images = itemImages.map((image) => image.path);

  const result = await Item.create(payload);

  //* meilisearch start
  const { _id, title, description, images: meiliImages } = result;
  await meiliClient.index('items').addDocuments([
    {
      _id: _id.toString(),
      title,
      description,
      images: meiliImages?.[0] || noImage,
    },
  ]);

  // await addDocumentToIndex(result, 'items');
  //* meilisearch end

  return result;
};

const getAllItemsFromDB = async (query: Record<string, unknown>) => {
  query = (await SearchItemByUserQueryMaker(query)) || query;

  // Date range search
  query = (await SearchItemByDateRangeQueryMaker(query)) || query;

  const itemQuery = new QueryBuilder(
    Item.find().populate('user').populate('category'),
    query
  )
    .filter()
    .search(ItemsSearchableFields)
    .sort()
    // .paginate()
    .fields();

  const result = await itemQuery.modelQuery;

  return result;
};

const getItemFromDB = async (itemId: string) => {
  const result = await Item.findById(itemId)
    .populate('user')
    .populate('category');
  return result;
};

const updateItemInDB = async (itemId: string, payload: TItem) => {
  const result = await Item.findByIdAndUpdate(itemId, payload, { new: true });
  // if (result) {
  //   await addDocumentToIndex(result, 'items');
  // } else {
  //   throw new Error(`Item with ID ${itemId} not found.`);
  // }
  return result;
};

const deleteItemFromDB = async (itemId: string) => {
  const result = await Item.findByIdAndDelete(itemId);

  const deletedItemId = result?._id;
  if (deletedItemId) {
    await deleteDocumentFromIndex('items', deletedItemId.toString());
  }
  return result;
};

export const ItemServices = {
  createItemIntoDB,
  getAllItemsFromDB,
  getItemFromDB,
  updateItemInDB,
  deleteItemFromDB,
};
