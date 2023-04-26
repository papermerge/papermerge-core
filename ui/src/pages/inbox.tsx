import { useEffect, useState } from 'react';

import Head from "next/head";
import Layout from '../components/layout';

import { getCurrentUser } from "@/utils";


export default function Inbox() {
  const user_context = getCurrentUser();
  const [ node_id, set_node_id ] = useState(null);

  useEffect( () => {
    if (!node_id) {
      set_node_id(user_context.user?.home_folder_id);
    }
  }, [user_context.user]);

  if (!node_id ) {
    return <div>Loading...</div>;
  }

  return (
    <Layout>
      <Head>
        <title>Inbox</title>
      </Head>
      {node_id}
    </Layout>
  );
}