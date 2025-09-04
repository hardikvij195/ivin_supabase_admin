import React, { Suspense } from 'react'
import ChatClient from './ChatClient'

const page = () => {
  return (
    <Suspense>
        <ChatClient/>
    </Suspense>
  )
}

export default page