import { Suspense } from "react";
import AttributeValuesPage from "./AttributevaluesPage";


export default function Page() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <AttributeValuesPage />
    </Suspense>
  );
}