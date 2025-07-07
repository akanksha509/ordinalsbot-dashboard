'use client'

import Link from 'next/link'
import { ExternalLink, Github, Twitter, MessageCircle, FileText } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { getNetworkFromEnv } from '@/lib/utils'

export function Footer() {
  const currentYear = new Date().getFullYear()
  const network = getNetworkFromEnv()
  const isTestnet = network === 'testnet'

  const links = [
    {
      title: 'Resources',
      items: [
        { name: 'OrdinalsBot Docs', href: 'https://docs.ordinalsbot.com', icon: FileText },
        { name: 'API Documentation', href: 'https://docs.ordinalsbot.com/api', icon: FileText },
      ]
    },
  {
  title: 'Support',
  items: [
    {
      name: 'Help Center',
      href: 'https://ordinalsbot.com/faq',
      icon: MessageCircle
    },
    {
      name: 'Contact Support',
      href: 'mailto:support@ordinalsbot.com?cc=aknakshathaku2311%40gmail.com&subject=Demo%20Dashboard%20-%20Frontend%20Assessment%20Inquiry',
      icon: MessageCircle
    }
  ]
},

    {
      title: 'Community',
      items: [
        { name: 'Twitter', href: 'https://twitter.com/ordinalsbot', icon: Twitter },
        { name: 'GitHub', href: 'https://github.com/ordinalsbot', icon: Github },
        { name: 'Discord', href: 'https://discord.com/invite/9nBhVgCjct', icon: MessageCircle },
      ]
    }
  ]

  return (
    <footer className="border-t bg-muted/50">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        {/* Network Status Banner */}
        {isTestnet && (
          <div className="py-3 border-b border-border">
            <div className="flex items-center justify-center space-x-2">
              <Badge variant="warning" className="animate-pulse">
                TESTNET MODE
              </Badge>
              <span className="text-sm text-muted-foreground">
                You are currently using the Bitcoin Testnet
              </span>
            </div>
          </div>
        )}

        {/* Main Footer Content */}
        <div className="py-12">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            {/* Brand Section */}
            <div className="space-y-4">
              <div>
                <h3 className="text-lg font-semibold">OrdinalsBot Dashboard</h3>
                <p className="text-sm text-muted-foreground mt-2">
                  Your gateway to Bitcoin Ordinals and BRC-20 tokens. Built with Next.js and powered by OrdinalsBot API.
                </p>
              </div>
              
              <div className="flex space-x-2">
                <Button variant="outline" size="icon" asChild>
                  <Link href="https://x.com/Akanksh62278715" target="_blank" rel="noopener noreferrer">
                    <Twitter className="h-4 w-4" />
                  </Link>
                </Button>
                <Button variant="outline" size="icon" asChild>
                  <Link href="https://github.com/akanksha509" target="_blank" rel="noopener noreferrer">
                    <Github className="h-4 w-4" />
                  </Link>
                </Button>
              </div>
            </div>

            {/* Links Sections */}
            {links.map((section) => (
              <div key={section.title} className="space-y-4">
                <h4 className="text-sm font-semibold">{section.title}</h4>
                <ul className="space-y-2">
                  {section.items.map((item) => (
                    <li key={item.name}>
                      <Link
                        href={item.href}
                        target={item.href.startsWith('http') ? '_blank' : undefined}
                        rel={item.href.startsWith('http') ? 'noopener noreferrer' : undefined}
                        className="text-sm text-muted-foreground hover:text-foreground transition-colors inline-flex items-center space-x-1"
                      >
                        <item.icon className="h-3 w-3" />
                        <span>{item.name}</span>
                        {item.href.startsWith('http') && (
                          <ExternalLink className="h-3 w-3" />
                        )}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="py-6 border-t border-border">
          <div className="flex flex-col sm:flex-row justify-between items-center space-y-4 sm:space-y-0">
            <div className="flex flex-col sm:flex-row items-center space-y-2 sm:space-y-0 sm:space-x-4 text-sm text-muted-foreground">
              <span>© {currentYear} OrdinalsBot Dashboard</span>
              <span className="hidden sm:inline">•</span>
              <span>Built for the Bitcoin Ordinals ecosystem</span>
              <span className="hidden sm:inline">•</span>
              <Badge variant="outline" className="text-xs">
                Demo Version
              </Badge>
            </div>

            <div className="flex items-center space-x-4 text-sm text-muted-foreground">
              <span>Powered by</span>
              <Link 
                href="https://ordinalsbot.com" 
                target="_blank" 
                rel="noopener noreferrer"
                className="font-medium text-foreground hover:text-primary transition-colors"
              >
                OrdinalsBot API
              </Link>
            </div>
          </div>
        </div>
      </div>
    </footer>
  )
}