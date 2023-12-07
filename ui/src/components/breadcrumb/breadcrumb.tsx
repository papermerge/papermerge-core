import BreadcrumbItem from "./item";
import Spinner from "components/spinner";
import SpinnerPlaceholder from "components/spinner_placeholder";
import { NType } from "types";

import "./breadcrumb.scss";

type Args = {
  path: Array<[string, string]>;
  onClick: (node: NType) => void;
  is_loading: boolean;
}

export default function Breadcrumb({path, onClick, is_loading}: Args) {

  let breadcrumb_items = path.map((item: [string, string], index: number) => {
    return (
      <BreadcrumbItem key={item[0]} active={index === (path.length - 1)}
        node_id={item[0]}
        node_title={item[1]}
        onClick={onClick} />
    );
  });

  return (
    <nav aria-label="breadcrumb" className="breadcrumb mb-1 mt-1">
      <ol className="nav-breadcrumb breadcrumb">
        {is_loading ? <Spinner />: <SpinnerPlaceholder />}
        {breadcrumb_items}
      </ol>
    </nav>
  );
}
