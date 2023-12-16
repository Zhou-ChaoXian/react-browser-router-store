"use strict";

import {useLayoutEffect} from "react";
import {useNavigate, generatePath, useLocation, useParams} from "react-router-dom";

export {
  Redirect as default,
};

/**
 * @param path {string}
 * @param options {import("react-router-dom").NavigateOptions | undefined}
 * @param children {React.ReactNode}
 * @return {React.ReactNode}
 */
function Redirect({path, options, children}) {
  const navigate = useNavigate();
  const params = useParams();
  const {search, hash} = useLocation();
  const pathname = generatePath(path, params);
  useLayoutEffect(() => {
    navigate({pathname, search, hash}, options);
  }, []);
  return children;
}