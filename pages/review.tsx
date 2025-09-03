import { GetServerSideProps } from "next"

export const getServerSideProps: GetServerSideProps = async () => {
  return {
    redirect: {
      destination: "/preview",
      permanent: false,
    },
  }
}

export default function ReviewRedirect() {
  return null
}

