"use client"

import React from 'react'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '../ui/dropdown-menu'
import { CreditCard, LogOut, Settings2, User } from 'lucide-react'
import Link from 'next/link'
import Image from 'next/image'
import { useQuery } from 'convex/react'
import { api } from '@/convex/_generated/api'
import { useAuthActions } from '@convex-dev/auth/react'
import { DropdownMenuSeparator } from '@radix-ui/react-dropdown-menu'

const UserMenu = () => {
    const user = useQuery(api.auth.loggedInUser)
    const {signOut} = useAuthActions()
  return (
      <DropdownMenu>
                  <DropdownMenuTrigger asChild>
              <img className='size-8 shrink-0 rounded-full' width={32} height={32} src={user?.image || "/user.png"} alt={ user?.name || "user" } />
                  </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
                        <DropdownMenuItem className="group" >
                      <Link className="flex items-center gap-2 group-hover:text-white" href={`/dashboard/settings?selected=profile`}>
                      <User className="w-4 h-4 mr-2 group-hover:text-white" />
                        Profile
                      </Link>
              </DropdownMenuItem>
              

                        <DropdownMenuItem className="group" >
                      <Link className="flex items-center gap-2 group-hover:text-white" href={`/dashboard/settings?selected=billing`}>
                      <CreditCard className="w-4 h-4 mr-2 group-hover:text-white" />
                        Billing
                      </Link>
                    </DropdownMenuItem>
              
                    <DropdownMenuItem className="group" >
                      <Link className="flex items-center gap-2 group-hover:text-white" href={`/dashboard/settings`}>
                      <Settings2 className="w-4 h-4 mr-2 group-hover:text-white" />
                        Settings
                      </Link>
                    </DropdownMenuItem>
                  
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={signOut} className="text-destructive group">
                      <LogOut className="w-4 h-4 mr-2 text-destructive group-hover:text-white" />
                      Logout
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
  )
}

export default UserMenu