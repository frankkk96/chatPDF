"use client";
import React from 'react'
import axios from 'axios';
import { Button } from './ui/button';

type Props = {isPro: boolean}

const SubscriptionButton = ({isPro}: Props) => {
    const [loading, setLoading] = React.useState(false)
    const handleSubscription = async () => {
        try {
          setLoading(true)
          const response = await axios.get('/api/stripe/')
          window.location.href = response.data.url
        } catch (error) {
          console.error(error)
        } finally {
          setLoading(false)
        }
      }
  return (
    <Button disabled={loading} onClick={handleSubscription} variant="outline">
        {isPro ? 'Manage Subscription' : 'Upgrade to Pro'}
    </Button>
  )
}

export default SubscriptionButton