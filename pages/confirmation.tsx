import { GetServerSideProps } from "next";

export const getServerSideProps: GetServerSideProps = async () => {
  return {
    redirect: {
      destination: "/checkout",
      permanent: false,
    },
  };
};

export default function ConfirmationRedirect() {
  return null;
}

