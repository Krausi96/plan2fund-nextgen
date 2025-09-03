import { GetServerSideProps } from "next"

export const getServerSideProps: GetServerSideProps = async () => {
  return {
    redirect: {
      destination: "/results",
      permanent: false,
    },
  }
}

export default function EligibilityRedirect() {
  return null
}