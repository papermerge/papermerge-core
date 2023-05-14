import { useState } from 'react';

import Layout from './layout';
import Commander from './commander/commander';
import Viewer from './viewer/viewer';

import { NodeClickArgsType } from 'types';


function Home() {
  const [ node_id, set_node_id ] = useState('be97f78c-82db-417d-a62b-e3c048295a41');
  const [ node_type, set_node_type ] = useState('folder');
  const [ page_number, set_page_number ] = useState(1);
  const [ per_page, set_per_page ] = useState(5);

  const onNodeClick = ({node_id, node_type}: NodeClickArgsType) => {
    console.log(`onNodeClick node_id=${node_id}, node_type=${node_type}`);
    set_node_id(node_id);
    set_node_type(node_type);
  }

  const onPageClick = (num: number) => {
    set_page_number(num);
  }

  const onPerPageChange = (num: number) => {
    set_per_page(num);
  }

  if (!node_id ) {
    return <div>Loading...</div>;
  }

  if (node_type == 'folder') {
    return (
      <Layout>
        <Commander
          node_id={node_id}
          page_number={page_number}
          per_page={per_page}
          onNodeClick={onNodeClick}
          onPageClick={onPageClick}
          onPerPageChange={onPerPageChange}
        />
      </Layout>
    );
  }

  // node_type == 'document'
  return (
    <Layout>
      <Viewer node_id={node_id} onNodeClick={onNodeClick} />
    </Layout>
  );
}

export default Home;
