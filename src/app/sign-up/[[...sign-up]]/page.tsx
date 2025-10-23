import { SignUp } from "@clerk/nextjs";

export default function Page() {
  return (
    <SignUp
      appearance={{
        elements: {
          formField__firstName: "hidden", // hide first name
          formField__lastName: "hidden", // hide last name
        },
      }}
    />
  );
}
