import { fetcher_post, fetcher_upload } from 'utils/fetcher';
import type { CreatedNodesType, NodeType } from 'types';


type UploaderArgs = {
  files: FileList;
  node_id: string;
}

type CreateDocumentType = {
  title: string;
  parent_id: string;
  ctype: 'document';
}


async function uploader({files, node_id}: UploaderArgs): Promise<CreatedNodesType> {
  let bulk_create_docs: any = [];

  Array.from(files, (file) => {
    let data: CreateDocumentType = {
      title: file.name,
      parent_id: node_id,
      ctype: 'document'
    }

    bulk_create_docs.push(
      fetcher_post<CreateDocumentType, NodeType>('/api/nodes/', data)
    );
  });

  Promise.all(bulk_create_docs).then(
    (values: NodeType[]) => {
      // notify commander to add document nodes
      values.forEach(value => {
        let file: File|undefined = Array.from(files).find(item => item.name == value.title)
        if (file) {
          fetcher_upload(
            `/api/documents/${value.id}/upload`, file
          );
        } else {
          console.log(`${value.title} NOT FOUND!`);
        }
      });
    }
  );

  return Promise.all(bulk_create_docs).then(
    (values: NodeType[]) => {
      return {nodes: values, parent_id: node_id};
    }
  );
}

export { uploader };
