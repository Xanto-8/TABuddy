const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()

async function main() {
  const existingSuperAdmin = await prisma.user.findFirst({
    where: { role: 'superadmin' },
  })

  if (existingSuperAdmin) {
    console.log('超级管理员已存在，更新密码...')
    await prisma.user.update({
      where: { id: existingSuperAdmin.id },
      data: { password: 'ADMIN 123' },
    })
    console.log('用户名:', existingSuperAdmin.username)
    console.log('密码: ADMIN 123')
    return
  }

  const admin = await prisma.user.upsert({
    where: { username: 'admin' },
    update: {
      password: 'ADMIN 123',
      displayName: '超级管理员',
      role: 'superadmin',
    },
    create: {
      username: 'admin',
      password: 'ADMIN 123',
      displayName: '超级管理员',
      role: 'superadmin',
    },
  })

  console.log('✅ 默认超级管理员设置成功！')
  console.log('用户名: admin')
  console.log('密码: ADMIN 123')
  console.log('请登录后立即修改密码！')
}

main()
  .catch((e) => {
    console.error('Seed 失败:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
