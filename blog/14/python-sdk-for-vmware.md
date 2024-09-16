# 使用Python SDK操作VMware进行虚拟机创建和配置变更

## 前言

最近在搞虚拟机变更自动化的对接，支持了两个平台，分别是 SmartX 和 VMware 平台。这篇文章记录一下使用 Python SDK 进行 VMware 虚拟机操作的一些实战场景，主要包括快照创建、快照删除、计算资源变更、磁盘扩容等操作。

::: primary

💩 **感慨**

VMware 的使用和 Python SDK 使用已经不是第一次了，之前就因为 CMDB 进行过全资源采集，而 SmartX 则是第一次对接，看了 SmartX 的接口文档才真的见识了什么叫好的接口文档，真的是清晰明了，完全是可以边看边调，相比之下 VMware 的接口文档就是负作用，看了只会浪费自己时间和让自己摸不着头脑，还不如直接让 ChatGPT 写。
:::

## SDK 封装代码

先来一个自己封装好的 VMware 连接和基本操作的管理类代码，这个类提供了一些常用的函数，比如支持 with 语法的连接和断开连接操作、获取单个资源实例和全部资源实例的函数、使用不同方式获取虚拟机实例的、开关机、资源变更操作等。利用这些提供好的函数，基本就可以支持常见资源变更场景了。

```python
# -*- coding: utf-8 -*-
import logging
import ssl
import time

from pyVim.connect import SmartConnect, Disconnect
from pyVmomi import vim

FORMAT = '[%(asctime)s (line:%(lineno)d) %(levelname)s] %(message)s'
logging.basicConfig(level=logging.INFO, datefmt='%Y-%m-%d %H:%M:%S', format=FORMAT)
logger = logging.getLogger(__name__)


class VMwareManager:
    def __init__(self, host, user, password, port=443):
        self.host = host
        self.user = user
        self.password = password
        self.port = port
        self.si = None
        self.content = None

    def __enter__(self):
        self.connect()
        return self

    def __exit__(self, exc_type, exc_val, exc_tb):
        self.disconnect()

    def connect(self):
        logger.info('Connect vmware start ...')
        context = ssl.SSLContext(ssl.PROTOCOL_TLSv1_2)
        context.verify_mode = ssl.CERT_NONE
        self.si = SmartConnect(host=self.host, user=self.user, pwd=self.password,
                               port=self.port, sslContext=context)
        self.content = self.si.RetrieveContent()

    def disconnect(self):
        if self.si:
            Disconnect(self.si)
        logger.info('Disconnect vmware done.')

    def _get_obj(self, obj_type, name=None, _moId=None):
        """通过名称或者_moId获取实例，获取不到就报错"""
        container = self.content.viewManager.CreateContainerView(self.content.rootFolder,
                                                                 obj_type, True)
        if name:
            for c in container.view:
                if c.name == name:
                    return c
        if _moId:
            for c in container.view:
                if c._moId == _moId:
                    return c
        raise Exception('Get obj {} by name or _moId failed'.format(obj_type))

    def _get_all_objs(self, obj_type, folder=None):
        """批量获取实例"""
        if folder is None:
            container = self.content.viewManager.CreateContainerView(self.content.rootFolder,
                                                                     obj_type, True)
        else:
            container = self.content.viewManager.CreateContainerView(folder, obj_type, True)
        return container.view

    @staticmethod
    def _wait_for_task(task, timeout=120, interval=5):
        """任务在queued和running都需要等待，成功时返回结果，失败或执行超时都报异常"""
        start_time = time.time()
        task_desc = task.info.descriptionId
        while task.info.state in [vim.TaskInfo.State.running, vim.TaskInfo.State.queued]:
            exec_time = int(time.time() - start_time)
            if exec_time > timeout:
                raise Exception("Task {} timed out.".format(task_desc))
            time.sleep(interval)
            logger.info('Task {} is running {}/{} ...'.format(task_desc, exec_time, timeout))
        if task.info.state == vim.TaskInfo.State.success:
            print("Task {} completed successfully.".format(task_desc))
            return task.info.result
        else:
            raise Exception("Task failed: {}".format(task.info))

    def get_vm_by_uuid(self, uuid):
        """通过uuid获取虚拟机"""
        objs = self._get_all_objs([vim.VirtualMachine])
        for obj in objs:
            if obj.config.uuid == uuid:
                return obj
        raise Exception('Get vm by uuid {} failed.'.format(uuid))

    def vm_power_off(self, vm):
        if vm.runtime.powerState == vim.VirtualMachinePowerState.poweredOff:
            print('虚拟机 {} 已关机，无需执行关机操作'.format(vm.name))
        else:
            print('虚拟机 {} 执行关机 ...'.format(vm.name))
            task = vm.PowerOffVM_Task()
            self._wait_for_task(task, 30)
            print('虚拟机 {} 关机完成'.format(vm.name))

    def vm_power_on(self, vm):
        if vm.runtime.powerState == vim.VirtualMachinePowerState.poweredOn:
            print('虚拟机 {} 已开机，无需执行开机操作'.format(vm.name))
        else:
            print('虚拟机 {} 执行开机 ...'.format(vm.name))
            task = vm.PowerOnVM_Task()
            self._wait_for_task(task, 30)
            print('虚拟机 {} 开机完成'.format(vm.name))

    @staticmethod
    def check_vm_is_power_off(vm):
        if vm.runtime.powerState != vim.VirtualMachinePowerState.poweredOff:
            raise Exception('虚拟机未处理关机状态，无法执行变更！！！')
        else:
            print('虚拟机已经关机，可执行变更操作。')

    @staticmethod
    def print_cpu_and_memory(vm):
        cpu, memory = vm.summary.config.numCpu, vm.summary.config.memorySizeMB // 1024
        print('虚拟机 {} 当前CPU：{}，内存：{}GB'.format(vm.name, cpu, memory))

    @staticmethod
    def print_power_state(vm):
        power_state = vm.runtime.powerState
        print('虚拟机 {} 当前电源状态：{}'.format(vm.name, power_state))

    def print_disks(self, vm):
        disks = self.get_vm_disks(vm)
        size_info = {disk.unitNumber: disk.capacityInKB // 1024 // 1024 for disk in disks}
        print('虚拟机 {} 磁盘信息(GB)：{}'.format(vm.name, size_info))

    @staticmethod
    def get_vm_disks(vm):
        """返回虚拟机磁盘"""
        disks = []
        for device in vm.config.hardware.device:
            if isinstance(device, vim.vm.device.VirtualDisk):
                disks.append(device)
        return disks

    def get_disk_by_check_disk_size(self, vm, check_size_kb):
        """
        利用磁盘大小找到虚拟机的磁盘，比如已知Windows的D盘是100G，则可以通过这个找到具体磁盘
        注意：对于多个磁盘相差很接近的，这个方法不适合，比如D盘和E盘都是100G，此时找到的不准
        """
        check_dict = {}
        disks = self.get_vm_disks(vm)
        for disk in disks:
            disk_size_kb = disk.capacityInKB
            abs_size = abs(disk_size_kb - check_size_kb)
            check_dict[abs_size] = disk
        print('磁盘差值KB: {}'.format(check_dict.keys()))
        min_size = min(check_dict.keys())
        get_disk = check_dict[min_size]
        print('磁盘差值最小值为 {}MB，磁盘编号：{}'.format(min_size // 1024, get_disk.unitNumber))
        return get_disk

    def vm_resize(self, vm, new_cpu=None, new_memory_gb=None):
        """计算资源变更，CPU内存都可以变更，需要在关机情况下执行（除非支持热更新）"""
        spec = vim.vm.ConfigSpec()
        if new_cpu:
            spec.numCPUs = new_cpu
        if new_memory_gb:
            spec.memoryMB = new_memory_gb * 1024

        print('虚拟机 {} 开始执行计算资源变更 ...'.format(vm.name))
        task = vm.ReconfigVM_Task(spec)
        self._wait_for_task(task)
        print('虚拟机 {} 计算资源变更完成'.format(vm.name))

    def expand_disk_by_add_size(self, vm, disk, add_size_gb):
        """
        扩容指定磁盘
        前置条件：
            1.支持热扩容的可以直接扩容，否则需要关机后扩容
            2.不能有快照存在，因此需要先清理快照
        """
        old_size_kb = disk.capacityInKB
        add_size_kb = add_size_gb * 1024 * 1024
        new_size_kb = old_size_kb + add_size_kb
        print('准备将磁盘 {} 从 {} GB扩容到 {} GB'.format(disk.unitNumber,
                                                          old_size_kb // 1024 // 1024,
                                                          new_size_kb // 1024 // 1024))

        # 设置扩容磁盘配置
        disk_spec = vim.vm.device.VirtualDeviceSpec()
        disk_spec.operation = vim.vm.device.VirtualDeviceSpec.Operation.edit
        disk_spec.device = disk
        disk_spec.device.capacityInKB = new_size_kb

        # 应用配置到虚拟机
        vm_spec = vim.vm.ConfigSpec()
        vm_spec.deviceChange = [disk_spec]

        task = vm.ReconfigVM_Task(spec=vm_spec)
        self._wait_for_task(task)
        logger.info('磁盘{}扩容完成！！！'.format(disk.unitNumber))

    def add_disk(self, vm, size_gb, thin=True):
        """
        新增磁盘，thin=True表示精简置备
        前置条件：
            1.支持热扩容的可以直接扩容，否则需要关机后扩容
            2.不能有快照存在，因此需要先清理快照
        """
        logger.info('准备新增磁盘 {} GB'.format(size_gb))
        size_kb = size_gb * 1024 * 1024

        controller = None
        for device in vm.config.hardware.device:
            if isinstance(device, vim.vm.device.VirtualSCSIController):
                controller = device
                break
        if not controller:
            raise Exception('No SCSI controller found in the VM {}'.format(vm.name))
        unit_number = len(controller.device)  # 磁盘序号，从0开始，自动生成就行
        print('新增磁盘序号: {}'.format(unit_number))

        # 新增磁盘spec
        disk_spec = vim.vm.device.VirtualDeviceSpec()
        disk_spec.fileOperation = 'create'
        disk_spec.operation = vim.vm.device.VirtualDeviceSpec.Operation.add
        disk_spec.device = vim.vm.device.VirtualDisk()
        disk_spec.device.backing = vim.vm.device.VirtualDisk.FlatVer2BackingInfo()
        disk_spec.device.backing.thinProvisioned = thin
        disk_spec.device.backing.diskMode = 'persistent'
        disk_spec.device.unitNumber = unit_number
        disk_spec.device.capacityInKB = size_kb
        disk_spec.device.controllerKey = controller.key
        # print(disk_spec)

        # 应用到虚拟机
        vm_spec = vim.vm.ConfigSpec()
        vm_spec.deviceChange = [disk_spec]

        task = vm.ReconfigVM_Task(spec=vm_spec)
        self._wait_for_task(task)
        logger.info('新增磁盘完成!!!')

    def remove_disk(self, vm, disk):
        print('准备删除磁盘编号：{}'.format(disk.unitNumber))
        disk_spec = vim.vm.device.VirtualDeviceSpec()
        disk_spec.operation = vim.vm.device.VirtualDeviceSpec.Operation.remove
        disk_spec.device = disk

        # 应用到虚拟机
        vm_spec = vim.vm.ConfigSpec()
        vm_spec.deviceChange = [disk_spec]

        task = vm.ReconfigVM_Task(spec=vm_spec)
        self._wait_for_task(task)
        logger.info('删除磁盘完成!!!')

    def _list_snapshots_recursively(self, snapshots):
        """递归查询快照"""
        snapshot_list = []
        for snapshot in snapshots:
            snapshot_list.append(snapshot)
            snapshot_list.extend(self._list_snapshots_recursively(snapshot.childSnapshotList))
        return snapshot_list

    def get_snapshots(self, vm):
        """返回虚拟机快照列表"""
        snapshots = vm.snapshot.rootSnapshotList if vm.snapshot else []
        snapshot_list = self._list_snapshots_recursively(snapshots)
        return snapshot_list

    def create_snapshot(self, vm, snapshot_name, snapshot_desc='', memory=True, quiesce=False):
        """
        创建快照
        :param vm: 虚拟机对象
        :param snapshot_name: 快照名称
        :param snapshot_desc: 快照描述
        :param memory: 是否包含虚拟机内存状态，建议True
        :param quiesce: 是否保持磁盘状态，建议False
        :return:
        """
        task = vm.CreateSnapshot_Task(
            name=snapshot_name,
            description=snapshot_desc,
            memory=memory,
            quiesce=quiesce
        )
        self._wait_for_task(task)
        logger.info('创建快照 {} 完成!!!'.format(snapshot_name))

    def delete_snapshot(self, vm, snapshot_id, remove_children=False):
        snapshot_item = None
        snapshot_list = self.get_snapshots(vm)
        for snapshot in snapshot_list:
            if str(snapshot.id) == str(snapshot_id):
                snapshot_item = snapshot
                break
        if snapshot_item:
            task = snapshot_item.snapshot.RemoveSnapshot_Task(removeChildren=remove_children)
            self._wait_for_task(task)
            logger.info('删除快照 id={} 完成'.format(snapshot_id))
        else:
            logger.warning('快照id={}不存在，不需要删除'.format(snapshot_id))

    def delete_all_snatshots(self, vm):
        snapshot_list = self.get_snapshots(vm)
        if snapshot_list:
            logger.info('开始清理快照')
            for snapshot in snapshot_list:
                self.delete_snapshot(vm, snapshot.id)
            logger.info('快照清理完成')
        else:
            logger.info('没有快照，无需清理')
			
def main():
    with VMwareManager(VMWARE_HOST, VMWARE_USERNAME, VMWARE_PASSWORD, VMWARE_PORT) as vm_manager:
        # vm_list = vm_manager._get_all_objs([vim.VirtualMachine])
        # for vm in vm_list:
        #     # print(dir(vm))
        #     print(vm._moId, vm.name)
        # vm = vm_manager._get_obj([vim.VirtualMachine], _moId='15')
        vm = vm_manager.get_vm_by_uuid('564da6fb-8ed5-f765-da86-238c1dfbe934')
        vm_manager.print_power_state(vm)
        vm_manager.print_cpu_and_memory(vm)
        vm_manager.print_disks(vm)
        # disk = vm_manager.get_disk_by_check_disk_size(vm, 100 * 1024 * 1024)
        # vm_manager.expand_disk_by_add_size(vm, disk, 100)
        # 
        # vm_manager.add_disk(vm, 100, False)
        # vm_manager.remove_disk(vm, disk)
        # 
        # snapshots = vm_manager.get_snapshots(vm)
        # print(snapshots)
        # vm_manager.create_snapshot(vm, 'test-01')
        # vm_manager.delete_all_snatshots(vm)
			
if __name__ == '__main__':
    VMWARE_HOST = '192.168.0.254'
    VMWARE_PORT = 443
    VMWARE_USERNAME = 'root'
    VMWARE_PASSWORD = 'admin@!9876'

    main()

```

## 虚拟机自动化变更场景

虚拟机的自动化场景我这里主要实现了常用资源变更，虚拟机创建的场景就没实现了，如果要实现，一定是通过模板创建虚拟机而不是直接去创建，不过我这里没试过，但是大致了解了一下是比较麻烦的。查到了一篇文章有进行过虚拟机通过模板创建的过程，可以参考一下：[vSphere通 python API接口创建虚拟机及修改配置](https://blog.csdn.net/quzuqiang/article/details/124151828 "vSphere通 python API接口创建虚拟机及修改配置")

### 计算资源(CPU和内存)变更

计算资源的变更支持单独变更CPU或内存，也可以同时变更，可以库容也可以缩容，代码演示：

```python
def resize_cpu_memory():
    """
    CPU和内存变更，一般情况下需要关机变更，除非支持热更新，则可以直接扩容，但不能缩容
    :return:
    """
    vm_uuid = '564da6fb-8ed5-f765-da86-238c1dfbe934'
    cpu = 8
    memory = 32

    with VMwareManager(VMWARE_HOST, VMWARE_USERNAME, VMWARE_PASSWORD, VMWARE_PORT) as vm_manager:
        vm = vm_manager.get_vm_by_uuid(vm_uuid)

        # 变更前检查是否关机，必须关机变更
        # 可以手动关机也可以自动关机，一般在ITSM流程中需要用户手动关机，减少变更带了的业务风险
        # vm_manager.vm_power_off(vm)
        vm_manager.check_vm_is_power_off(vm)

        # 变更前查询当前资源和状态
        vm_manager.print_power_state(vm)
        vm_manager.print_cpu_and_memory(vm)

        # 执行变更
        vm_manager.vm_resize(vm, new_cpu=cpu, new_memory_gb=memory)

        # 开机
        vm_manager.vm_power_on(vm)

        # 变更后查询当前资源和状态
        vm_manager.print_cpu_and_memory(vm)
        vm_manager.print_power_state(vm)

```

注意事项：

- 计算资源变更可以单独变更CPU或内存，也可以一起变更，并且扩容和缩容都支持
- 一般情况计算资源变更需要停机操作，虽然有的机器支持热更新可以不停机，但是由于支持缩容，所以停机是比较稳妥的
- 虽然可以使用脚本直接关机，但是安全起见，停机操作由主机管理员执行，而不是自动化脚本去执行，这样是为了保证主机上运行的服务可控的停掉

### 新增快照

快照的创建比较简单，只需要选定虚拟机，传入快照名称和描述即可。

```python
def create_snapshot():
    """
    为指定的虚拟机创建快照
    :return:
    """
    vm_uuid = '564da6fb-8ed5-f765-da86-238c1dfbe934'
    snapshot_name = "snapshot-test01"
    snapshot_desc = "快照描述"

    with VMwareManager(VMWARE_HOST, VMWARE_USERNAME, VMWARE_PASSWORD, VMWARE_PORT) as vm_manager:
        vm = vm_manager.get_vm_by_uuid(vm_uuid)
        vm_manager.create_snapshot(vm, snapshot_name=snapshot_name, snapshot_desc=snapshot_desc)

```

### 删除快照

删除快照可以通过名称来删除也可以通过快照ID，取决于查询快照的方式，还可以一次性删除某个虚拟机的所有快照。

```python
def delete_snapshot():
    """
    为指定的虚拟机删除快照
    :return:
    """
    vm_uuid = '564da6fb-8ed5-f765-da86-238c1dfbe934'
    snapshot_id = '1'

    with VMwareManager(VMWARE_HOST, VMWARE_USERNAME, VMWARE_PASSWORD, VMWARE_PORT) as vm_manager:
        vm = vm_manager.get_vm_by_uuid(vm_uuid)
        vm_manager.delete_snapshot(vm, snapshot_id=snapshot_id, remove_children=False)

```

### 新增磁盘

演示代码：

```python
def add_disk():
    """
    新增磁盘场景，只是服务器概念的磁盘增加，后续还要进行分区操作，属于系统层面的操作
    :return:
    """
    vm_uuid = '564da6fb-8ed5-f765-da86-238c1dfbe934'
    disk_size = 500

    with VMwareManager(VMWARE_HOST, VMWARE_USERNAME, VMWARE_PASSWORD, VMWARE_PORT) as vm_manager:
        vm = vm_manager.get_vm_by_uuid(vm_uuid)

        # 磁盘新增很多时候是不需要关机的，这个看实际支持情况
        # 可以手动关机也可以自动关机，一般在ITSM流程中需要用户手动关机，减少变更带了的业务风险
        # vm_manager.vm_power_off(vm)
        vm_manager.check_vm_is_power_off(vm)

        # 变更前查询当前资源和状态
        vm_manager.print_power_state(vm)
        vm_manager.print_disks(vm)
		
		# 清理全部快照
        vm_manager.delete_all_snatshots(vm)

        # 新增磁盘
        vm_manager.add_disk(vm, size_gb=disk_size, thin=True)

        # 开机
        vm_manager.vm_power_on(vm)

        # 变更后查询当前资源和状态
        vm_manager.print_disks(vm)
        vm_manager.print_power_state(vm)

```

注意事项：

- 新增磁盘前需要删除虚拟机所有快照
- 新增磁盘之后，在系统层面还需要进行分区操作，才可以把新增的磁盘分给具体分区
- 新增磁盘有一些属性可选，比如 thinProvisioned 属性，最好是参考一下原有磁盘的属性，跟原有磁盘保持一致


### 扩容磁盘

扩容磁盘的关键在于如何找到需要扩容的磁盘，比如用户只会告诉你他要扩容的分区，比如 Windows中的 D 盘或 Linux 中的 /data 盘，此时怎么获取到这个分区对应的磁盘？

我这里有一个基于实际情况约定的规则：

1. 实际情况是无论 Windows 还是 Linux 系统，不会有两个分区的大小相差接近，基本都是 100 G 以上的差别
2. 默认的系统每个分区对应单独的磁盘，不存在一个磁盘分给多个分区的情况
3. 基于前两点的实际情况，给出任意一个分区的大小，便可以找到一个大小跟这个分区很接近的磁盘，比如 /data 分区已知 289 GB，此时可以查到一个分区是 300 GB，另一个分区是 100 GB，则可以通过差值判断是 300 GB 那个磁盘
4. 特殊情况的处理：为了避免某些特殊的分区的确相差很解决，可以规定的一个原则，如果发现两个分区大小相差小于 100 GB 则报错不要库容，避免扩容错磁盘。

```python
def expand_disk():
    """
    扩容磁盘，选择一个磁盘进行扩容
    这里的关键是怎么选中磁盘，有一个思路是获取当前的分区，拿着分区大小去跟磁盘大小对比，一般磁盘大小会比分区稍微
    大一些，但是比较接近，这样就可以对应上，但是如果多个分区大小一致就不能使用这个方式，比如win里面D盘和E盘都是200G
    则无法匹配到实际的磁盘
    :return:
    """
    vm_uuid = '564da6fb-8ed5-f765-da86-238c1dfbe934'
    partition_size_kb = 200 * 1024 * 1024
    add_size_gb = 300

    with VMwareManager(VMWARE_HOST, VMWARE_USERNAME, VMWARE_PASSWORD, VMWARE_PORT) as vm_manager:
        vm = vm_manager.get_vm_by_uuid(vm_uuid)

        # 磁盘扩容一般要关机进行
        # 可以手动关机也可以自动关机，一般在ITSM流程中需要用户手动关机，减少变更带了的业务风险
        # vm_manager.vm_power_off(vm)
        vm_manager.check_vm_is_power_off(vm)

        # 变更前查询当前资源和状态
        vm_manager.print_power_state(vm)
        vm_manager.print_disks(vm)
		
		# 清理全部快照
        vm_manager.delete_all_snatshots(vm)

        # 扩容磁盘，先使用一定条件查询到要扩容的磁盘
        disk = vm_manager.get_disk_by_check_disk_size(vm, check_size_kb=partition_size_kb)
        vm_manager.expand_disk_by_add_size(vm, disk, add_size_gb=add_size_gb)

        # 开机
        vm_manager.vm_power_on(vm)

        # 变更后查询当前资源和状态
        vm_manager.print_disks(vm)
        vm_manager.print_power_state(vm)

```

注意事项：

- 磁盘扩容前需要删除虚拟机所有快照
- 在未知具体磁盘的情况下，如何准确找到要扩容的磁盘是关键点

## 向 ChatGPT 提问

使用 Python 操作 VMware 最简单的做法是向 ChatGPT 提问，让它写代码，你去调试，基本可以满足大部分需求，而且代码有效率极高。