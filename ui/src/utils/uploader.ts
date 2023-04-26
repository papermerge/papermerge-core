import { fetcher_post, fetcher_upload } from './fetcher';
import type { NodeType } from '@/types';


type UploaderArgs = {
  files: FileList;
  node_id: string;
  onCreateDocumentNode: (nodes: NodeType[]) => void;
}

type CreateDocumentType = {
  title: string;
  parent_id: string;
  ctype: 'document';
}


function upload_file(
  {file, node_id}: {file: File, node_id: string}
) {

}


function uploader({files, node_id, onCreateDocumentNode}: UploaderArgs) {
  let bulk_create_docs: any = [];

  Array.from(files, (file) => {
    let data: CreateDocumentType = {
      title: file.name,
      parent_id: node_id,
      ctype: 'document'
    }

    bulk_create_docs.push(
      fetcher_post<CreateDocumentType, NodeType>('/nodes/', data)
    );

    //fetcher_post<CreateDocumentType, NodeType>('/nodes/', data).then(
    //  (value: NodeType) => {
    //    onCreateDocumentNode(value);
    //  }
    //)
  });

  Promise.all(bulk_create_docs).then(
    (values: NodeType[]) => {
      // notify commander to add document nodes
      onCreateDocumentNode(values);
      values.forEach(value => {
        let file: File|undefined = Array.from(files).find(item => item.name == value.title)
        if (file) {
          fetcher_upload(
            `/documents/${value.id}/upload/`, file
          );
        } else {
          console.log(`${value.title} NOT FOUND!`);
        }
      });
    }
  );
}

export { uploader };
